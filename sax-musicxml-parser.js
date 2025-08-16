const sax = require('sax');
const fs = require('fs');

class SAXMusicXMLParser {
  constructor() {
    this.transposer = null;
  }

  setTransposer(transposer) {
    this.transposer = transposer;
  }

  _transposeXMLWithSAX(xmlData, semitones) {
    return new Promise((resolve, reject) => {
      const parser = sax.createStream(true, { lowercase: false });
      
      let output = '';
      let elementStack = [];
      let currentElement = null;
      let textContent = '';
      let insideNote = false;
      let insideHarmony = false;
      let insideKey = false;
      let insidePitch = false;
      let insideAccidental = false;
      
      // Current musical element data
      let noteData = {};
      let harmonyData = {};
      let keyData = {};
      let pitchBuffer = '';
      let pitchElements = [];
      let accidentalValue = null;

      parser.on('opentag', (node) => {
        elementStack.push(node.name);
        
        // Track what musical element we're inside
        if (node.name === 'note') {
          insideNote = true;
          noteData = {};
          accidentalValue = null;
        } else if (node.name === 'pitch') {
          insidePitch = true;
          pitchBuffer = '';
          pitchElements = [];
        } else if (node.name === 'accidental') {
          insideAccidental = true;
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
              
              const transposed = this.transposer.transposeNote(step, alter, octave, semitones);
              
              // Store transposed alter for accidental handling
              noteData.transposedAlter = transposed.alter !== undefined ? parseInt(transposed.alter) : 0;
              
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
        } else if (insideAccidental && tagName === 'accidental' && textContent.trim()) {
          // Handle accidental transposition based on transposed alter value
          const originalAccidental = textContent.trim();
          let transposedAccidental = originalAccidental;
          
          if (noteData.transposedAlter !== undefined) {
            // Map alter values to accidental names
            if (noteData.transposedAlter === 1) {
              transposedAccidental = 'sharp';
            } else if (noteData.transposedAlter === -1) {
              transposedAccidental = 'flat';
            } else if (noteData.transposedAlter === 0) {
              transposedAccidental = 'natural';
            } else if (noteData.transposedAlter === 2) {
              transposedAccidental = 'double-sharp';
            } else if (noteData.transposedAlter === -2) {
              transposedAccidental = 'double-flat';
            }
          }
          
          output += transposedAccidental;
        } else if (currentElement && textContent.trim()) {
          // Handle non-pitch transposition
          const originalValue = textContent.trim();
          let transposedValue = originalValue;
          
          if (insideHarmony && currentElement === tagName) {
            harmonyData[currentElement] = originalValue;
            
            if (currentElement === 'root-step') {
              const transposed = this.transposer.transposeNote(originalValue, 0, 4, semitones);
              transposedValue = transposed.step;
              harmonyData._transposedRoot = transposed;
              harmonyData._needsRootAlter = transposed.alter !== undefined;
              harmonyData._hasOriginalRootAlter = false; // Will be set to true if we see root-alter
            } else if (currentElement === 'root-alter') {
              const step = harmonyData['root-step'] || 'C';
              const transposed = this.transposer.transposeNote(step, parseInt(originalValue), 4, semitones);
              transposedValue = transposed.alter !== undefined ? transposed.alter.toString() : originalValue;
              harmonyData._transposedRoot = transposed;
              harmonyData._hasOriginalRootAlter = true; // Mark that original had root-alter
              harmonyData._needsRootAlter = false; // Don't add another
            } else if (currentElement === 'bass-step') {
              const transposed = this.transposer.transposeNote(originalValue, 0, 4, semitones);
              transposedValue = transposed.step;
              harmonyData._transposedBass = transposed;
              harmonyData._needsBassAlter = transposed.alter !== undefined;
              harmonyData._hasOriginalBassAlter = false; // Will be set to true if we see bass-alter
            } else if (currentElement === 'bass-alter') {
              const step = harmonyData['bass-step'] || 'C';
              const transposed = this.transposer.transposeNote(step, parseInt(originalValue), 4, semitones);
              transposedValue = transposed.alter !== undefined ? transposed.alter.toString() : originalValue;
              harmonyData._transposedBass = transposed;
              harmonyData._hasOriginalBassAlter = true; // Mark that original had bass-alter
              harmonyData._needsBassAlter = false; // Don't add another
            }
          } else if (insideKey && currentElement === 'fifths') {
            const currentFifths = parseInt(originalValue);
            
            // Create mapping from semitone transposition to fifths changes
            // Using the circle of fifths: C(0) G(1) D(2) A(3) E(4) B(5) F#(6) C#(7) / F(-1) Bb(-2) Eb(-3) Ab(-4) Db(-5) Gb(-6) Cb(-7)
            const semitonesToFifthsMap = [
              0,   // 0 semitones: C → C (0)
              7,   // 1 semitone:  C → Db (-5), but prefer C → C# (7)
              2,   // 2 semitones: C → D (2)
              -3,  // 3 semitones: C → Eb (-3)
              4,   // 4 semitones: C → E (4)
              -1,  // 5 semitones: C → F (-1)
              6,   // 6 semitones: C → F# (6) or Gb (-6) - prefer F# (6)
              1,   // 7 semitones: C → G (1)
              -4,  // 8 semitones: C → Ab (-4)
              3,   // 9 semitones: C → A (3)
              -2,  // 10 semitones: C → Bb (-2)
              5    // 11 semitones: C → B (5)
            ];
            
            const normalizedSemitones = ((semitones % 12) + 12) % 12;
            const fifthsChange = semitonesToFifthsMap[normalizedSemitones];
            let newFifths = currentFifths + fifthsChange;
            
            // Normalize to range -7 to +7
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
          accidentalValue = null;
        } else if (tagName === 'accidental') {
          insideAccidental = false;
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
        resolve(output);
      });

      parser.write(xmlData);
      parser.end();
    });
  }

  async transposeFile(filePath, interval, outputPath) {
    try {
      const xmlData = fs.readFileSync(filePath, 'utf8');
      
      // Extract and preserve XML declaration and DOCTYPE
      const xmlDeclarationMatch = xmlData.match(/^<\?xml[^>]*\?>\s*/);
      const doctypeMatch = xmlData.match(/<!DOCTYPE[^>]*>/);
      
      let output = '';
      if (xmlDeclarationMatch) {
        output += xmlDeclarationMatch[0];
      }
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
      
      // Use shared parsing method
      const semitones = this.transposer.parseInterval(interval);
      const transposedXML = await this._transposeXMLWithSAX(cleanXmlData, semitones);
      
      output += transposedXML;
      fs.writeFileSync(outputPath, output);
    } catch (error) {
      throw new Error(`Failed to process MusicXML file: ${error.message}`);
    }
  }

  async transposeToAllKeys(filePath, outputPath) {
    try {
      const xmlData = fs.readFileSync(filePath, 'utf8');
      
      // Extract XML declaration and DOCTYPE
      const xmlDeclarationMatch = xmlData.match(/^<\?xml[^>]*\?>\s*/);
      const doctypeMatch = xmlData.match(/<!DOCTYPE[^>]*>/);
      
      let output = '';
      if (xmlDeclarationMatch) {
        output += xmlDeclarationMatch[0];
      }
      if (doctypeMatch) {
        output += doctypeMatch[0] + '\n';
      }
      
      // Parse the structure to extract parts
      const parsedStructure = await this.parseStructure(xmlData);
      
      // Copy header information (includes opening score-partwise tag)
      output += parsedStructure.header;
      
      // For each part, create 12 transposed versions
      for (let partIndex = 0; partIndex < parsedStructure.parts.length; partIndex++) {
        const part = parsedStructure.parts[partIndex];
        output += `<part id="${part.id}">`;
        
        // Process all measures for each key (complete melody in each key)
        for (let semitone = 0; semitone < 12; semitone++) {
          // Add all measures for this key
          for (let measureIndex = 0; measureIndex < part.measures.length; measureIndex++) {
            const measure = part.measures[measureIndex];
            const measureNumber = semitone * part.measures.length + measureIndex + 1;
            const transposedMeasure = await this.transposeMeasure(measure, semitone);
            
            // Modify barline based on position
            let modifiedMeasure = transposedMeasure.replace(/number="\d+"/, `number="${measureNumber}"`);
            
            if (semitone === 11 && measureIndex === part.measures.length - 1) {
              // Last measure of last key - use final barline
              modifiedMeasure = this.updateBarline(modifiedMeasure, 'final');
            } else if (measureIndex === part.measures.length - 1) {
              // Last measure of each key - use double barline
              modifiedMeasure = this.updateBarline(modifiedMeasure, 'double');
            } else {
              // Regular measures - ensure no final barline
              modifiedMeasure = this.updateBarline(modifiedMeasure, 'none');
            }
            
            output += modifiedMeasure;
          }
        }
        
        output += '</part>';
      }
      
      output += '</score-partwise>';
      
      fs.writeFileSync(outputPath, output);
    } catch (error) {
      throw new Error(`Failed to process all keys: ${error.message}`);
    }
  }

  async parseStructure(xmlData) {
    // This is a simplified structure parser
    // In a full implementation, you'd want a more robust parser
    return new Promise((resolve, reject) => {
      const sax = require('sax');
      const parser = sax.createStream(true, { lowercase: false });
      
      let structure = { header: '', parts: [] };
      let currentPart = null;
      let currentMeasure = '';
      let insideHeader = true;
      let insidePart = false;
      let insideMeasure = false;
      let depth = 0;
      
      parser.on('opentag', (node) => {
        if (node.name === 'part') {
          insideHeader = false;
          insidePart = true;
          currentPart = { id: node.attributes.id, measures: [] };
        } else if (node.name === 'measure' && insidePart) {
          insideMeasure = true;
          currentMeasure = `<${node.name}`;
          for (let attr in node.attributes) {
            currentMeasure += ` ${attr}="${node.attributes[attr]}"`;
          }
          currentMeasure += '>';
          return;
        }
        
        if (insideHeader) {
          let tag = `<${node.name}`;
          for (let attr in node.attributes) {
            tag += ` ${attr}="${node.attributes[attr]}"`;
          }
          tag += '>';
          structure.header += tag;
        } else if (insideMeasure) {
          let tag = `<${node.name}`;
          for (let attr in node.attributes) {
            tag += ` ${attr}="${node.attributes[attr]}"`;
          }
          tag += '>';
          currentMeasure += tag;
        }
      });
      
      parser.on('text', (text) => {
        if (insideHeader) {
          structure.header += text;
        } else if (insideMeasure) {
          currentMeasure += text;
        }
      });
      
      parser.on('closetag', (tagName) => {
        if (tagName === 'part') {
          insidePart = false;
          structure.parts.push(currentPart);
          currentPart = null;
        } else if (tagName === 'measure' && insideMeasure) {
          insideMeasure = false;
          currentMeasure += `</${tagName}>`;
          currentPart.measures.push(currentMeasure);
          currentMeasure = '';
          return;
        }
        
        if (insideHeader) {
          structure.header += `</${tagName}>`;
        } else if (insideMeasure) {
          currentMeasure += `</${tagName}>`;
        }
      });
      
      parser.on('error', (err) => {
        reject(new Error(`Structure parsing error: ${err.message}`));
      });
      
      parser.on('end', () => {
        resolve(structure);
      });
      
      // Remove XML declaration and DOCTYPE for parsing
      let cleanXmlData = xmlData;
      const xmlDeclarationMatch = xmlData.match(/^<\?xml[^>]*\?>\s*/);
      const doctypeMatch = xmlData.match(/<!DOCTYPE[^>]*>/);
      if (xmlDeclarationMatch) {
        cleanXmlData = cleanXmlData.replace(xmlDeclarationMatch[0], '');
      }
      if (doctypeMatch) {
        cleanXmlData = cleanXmlData.replace(doctypeMatch[0], '');
      }
      cleanXmlData = cleanXmlData.trim();
      
      parser.write(cleanXmlData);
      parser.end();
    });
  }

  async transposeMeasure(measureXML, semitones) {
    return this._transposeXMLWithSAX(measureXML, semitones);
  }

  updateBarline(measureXML, barlineType) {
    if (barlineType === 'final') {
      // Replace any existing barline with final barline or add one
      if (measureXML.includes('<barline')) {
        return measureXML.replace(/<barline[^>]*>[\s\S]*?<\/barline>/g, '<barline location="right"><bar-style>light-heavy</bar-style></barline>');
      } else {
        return measureXML.replace('</measure>', '<barline location="right"><bar-style>light-heavy</bar-style></barline></measure>');
      }
    } else if (barlineType === 'double') {
      // Replace any existing barline with double barline or add one
      if (measureXML.includes('<barline')) {
        return measureXML.replace(/<barline[^>]*>[\s\S]*?<\/barline>/g, '<barline location="right"><bar-style>light-light</bar-style></barline>');
      } else {
        return measureXML.replace('</measure>', '<barline location="right"><bar-style>light-light</bar-style></barline></measure>');
      }
    } else {
      // Remove final barlines
      return measureXML.replace(/<barline[^>]*>[\s\S]*?<\/barline>/g, '');
    }
  }
}

module.exports = SAXMusicXMLParser;