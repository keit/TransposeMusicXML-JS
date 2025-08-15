const sax = require('sax');
const fs = require('fs');

class SAXMusicXMLParser {
  constructor() {
    this.transposer = null;
  }

  setTransposer(transposer) {
    this.transposer = transposer;
  }

  async transposeFile(filePath, interval, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const xmlData = fs.readFileSync(filePath, 'utf8');
        const parser = sax.createStream(true, { lowercase: false });
        
        let output = '';
        let elementStack = [];
        let currentElement = null;
        let textContent = '';
        let insideNote = false;
        let insideHarmony = false;
        let insideKey = false;
        let insidePitch = false;
        
        // Current musical element data
        let noteData = {};
        let harmonyData = {};
        let keyData = {};
        let pitchBuffer = '';
        let pitchElements = [];
        
        // Extract and preserve XML declaration and DOCTYPE
        const xmlDeclarationMatch = xmlData.match(/^<\?xml[^>]*\?>\s*/);
        if (xmlDeclarationMatch) {
          output += xmlDeclarationMatch[0];
        }
        
        const doctypeMatch = xmlData.match(/<!DOCTYPE[^>]*>/);
        if (doctypeMatch) {
          output += doctypeMatch[0] + '\n';
        }
        
        // Remove XML declaration and DOCTYPE from data for SAX parsing
        let cleanXmlData = xmlData;
        if (xmlDeclarationMatch) {
          cleanXmlData = cleanXmlData.replace(xmlDeclarationMatch[0], '');
        }
        if (doctypeMatch) {
          cleanXmlData = cleanXmlData.replace(doctypeMatch[0], '');
        }
        cleanXmlData = cleanXmlData.trim();

        parser.on('opentag', (node) => {
          elementStack.push(node.name);
          
          // Track what musical element we're inside
          if (node.name === 'note') {
            insideNote = true;
            noteData = {};
          } else if (node.name === 'pitch') {
            insidePitch = true;
            pitchBuffer = '';
            pitchElements = [];
          } else if (node.name === 'harmony') {
            insideHarmony = true;
            harmonyData = {};
          } else if (node.name === 'key') {
            insideKey = true;
            keyData = {};
          }
          
          // Store element data for transposition
          if (insidePitch && ['step', 'alter', 'octave'].includes(node.name)) {
            currentElement = node.name;
          } else if (insideHarmony && ['root-step', 'root-alter', 'bass-step', 'bass-alter'].includes(node.name)) {
            currentElement = node.name;
          } else if (insideKey && node.name === 'fifths') {
            currentElement = node.name;
          } else {
            currentElement = null;
          }
          
          // Buffer pitch elements, write others immediately
          if (insidePitch) {
            let tag = '<' + node.name;
            for (let attr in node.attributes) {
              tag += ` ${attr}="${node.attributes[attr]}"`;
            }
            tag += '>';
            pitchBuffer += tag;
          } else {
            // Write opening tag with attributes
            let tag = '<' + node.name;
            for (let attr in node.attributes) {
              tag += ` ${attr}="${node.attributes[attr]}"`;
            }
            tag += '>';
            output += tag;
          }
          
          textContent = '';
        });

        parser.on('text', (text) => {
          textContent += text;
        });

        parser.on('closetag', (tagName) => {
          // Handle pitch element buffering and transposition
          if (insidePitch) {
            if (currentElement && textContent.trim()) {
              const originalValue = textContent.trim();
              noteData[currentElement] = originalValue;
              
              // Store pitch element data
              if (currentElement === 'step') {
                noteData.step = originalValue;
              } else if (currentElement === 'alter') {
                noteData.alter = parseInt(originalValue);
              } else if (currentElement === 'octave') {
                noteData.octave = parseInt(originalValue);
              }
              
              pitchBuffer += originalValue;
            } else {
              pitchBuffer += textContent;
            }
            
            // Don't add closing tag to buffer for pitch element itself
            if (tagName !== 'pitch') {
              pitchBuffer += '</' + tagName + '>';
            }
            
            // When pitch element closes, transpose and output
            if (tagName === 'pitch') {
              if (noteData.step) {
                const step = noteData.step;
                const alter = noteData.alter || 0;
                const octave = noteData.octave || 4;
                
                const transposed = this.transposer.transposeNote(step, alter, octave, this.transposer.parseInterval(interval));
                
                // Build transposed pitch element
                let transposedPitch = '<pitch>';
                transposedPitch += `<step>${transposed.step}</step>`;
                if (transposed.alter !== undefined) {
                  transposedPitch += `<alter>${transposed.alter}</alter>`;
                }
                transposedPitch += `<octave>${transposed.octave}</octave>`;
                transposedPitch += '</pitch>';
                
                output += transposedPitch;
              } else {
                output += pitchBuffer;
              }
              
              insidePitch = false;
              pitchBuffer = '';
              pitchElements = [];
            }
          } else if (currentElement && textContent.trim()) {
            // Handle non-pitch transposition
            const originalValue = textContent.trim();
            let transposedValue = originalValue;
            
            if (insideHarmony && currentElement === tagName) {
              harmonyData[currentElement] = originalValue;
              
              if (currentElement === 'root-step') {
                const transposed = this.transposer.transposeNote(originalValue, 0, 4, this.transposer.parseInterval(interval));
                transposedValue = transposed.step;
                harmonyData._transposedRoot = transposed;
                harmonyData._needsRootAlter = transposed.alter !== undefined;
                harmonyData._hasOriginalRootAlter = false; // Will be set to true if we see root-alter
              } else if (currentElement === 'root-alter') {
                const step = harmonyData['root-step'] || 'C';
                const transposed = this.transposer.transposeNote(step, parseInt(originalValue), 4, this.transposer.parseInterval(interval));
                transposedValue = transposed.alter !== undefined ? transposed.alter.toString() : originalValue;
                harmonyData._transposedRoot = transposed;
                harmonyData._hasOriginalRootAlter = true; // Mark that original had root-alter
                harmonyData._needsRootAlter = false; // Don't add another
              } else if (currentElement === 'bass-step') {
                const transposed = this.transposer.transposeNote(originalValue, 0, 4, this.transposer.parseInterval(interval));
                transposedValue = transposed.step;
                harmonyData._transposedBass = transposed;
                harmonyData._needsBassAlter = transposed.alter !== undefined;
                harmonyData._hasOriginalBassAlter = false; // Will be set to true if we see bass-alter
              } else if (currentElement === 'bass-alter') {
                const step = harmonyData['bass-step'] || 'C';
                const transposed = this.transposer.transposeNote(step, parseInt(originalValue), 4, this.transposer.parseInterval(interval));
                transposedValue = transposed.alter !== undefined ? transposed.alter.toString() : originalValue;
                harmonyData._transposedBass = transposed;
                harmonyData._hasOriginalBassAlter = true; // Mark that original had bass-alter
                harmonyData._needsBassAlter = false; // Don't add another
              }
            } else if (insideKey && currentElement === 'fifths') {
              const currentFifths = parseInt(originalValue);
              let newFifths = currentFifths + this.transposer.parseInterval(interval);
              while (newFifths > 7) newFifths -= 12;
              while (newFifths < -7) newFifths += 12;
              transposedValue = newFifths.toString();
            }
            
            output += transposedValue;
          } else if (!insidePitch) {
            output += textContent;
          }
          
          // Write closing tag (except for pitch elements which are handled separately)
          if (!insidePitch || tagName === 'pitch') {
            // Don't write closing tag for pitch element as it's handled in the pitch logic
            if (tagName !== 'pitch') {
              output += '</' + tagName + '>';
              
              // Don't add alter elements immediately - wait until we know if original has them
            }
          }
          
          // Add missing alter elements when root or bass elements close
          if (insideHarmony && tagName === 'root' && harmonyData._needsRootAlter && !harmonyData._hasOriginalRootAlter && harmonyData._transposedRoot && harmonyData._transposedRoot.alter !== undefined) {
            // Insert root-alter before closing root
            const pos = output.lastIndexOf('</root>');
            if (pos !== -1) {
              output = output.substring(0, pos) + `<root-alter>${harmonyData._transposedRoot.alter}</root-alter>` + output.substring(pos);
            }
          } else if (insideHarmony && tagName === 'bass' && harmonyData._needsBassAlter && !harmonyData._hasOriginalBassAlter && harmonyData._transposedBass && harmonyData._transposedBass.alter !== undefined) {
            // Insert bass-alter before closing bass
            const pos = output.lastIndexOf('</bass>');
            if (pos !== -1) {
              output = output.substring(0, pos) + `<bass-alter>${harmonyData._transposedBass.alter}</bass-alter>` + output.substring(pos);
            }
          }
          
          // Reset state when exiting musical elements
          if (tagName === 'note') {
            insideNote = false;
            noteData = {};
          } else if (tagName === 'harmony') {
            insideHarmony = false;
            harmonyData = {};
          } else if (tagName === 'key') {
            insideKey = false;
            keyData = {};
          }
          
          elementStack.pop();
          currentElement = null;
          textContent = '';
        });

        parser.on('error', (err) => {
          reject(new Error(`SAX parsing error: ${err.message}`));
        });

        parser.on('end', () => {
          fs.writeFileSync(outputPath, output);
          resolve();
        });

        parser.write(cleanXmlData);
        parser.end();
        
      } catch (error) {
        reject(new Error(`Failed to process MusicXML file: ${error.message}`));
      }
    });
  }
}

module.exports = SAXMusicXMLParser;