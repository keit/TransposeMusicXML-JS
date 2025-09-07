import { SaxesParser, type SaxesTag } from "saxes";
import { MusicTransposer } from "./MusicTransposer";


interface HarmonyData {
  [key: string]: unknown;
  _transposedRoot?: { step: string; alter?: string; octave: number };
  _transposedBass?: { step: string; alter?: string; octave: number };
  _needsRootAlter?: boolean;
  _needsBassAlter?: boolean;
  _hasOriginalRootAlter?: boolean;
  _hasOriginalBassAlter?: boolean;
  _updateRootStep?: boolean;
  _removeLastRootAlter?: boolean;
  _removeLastBassAlter?: boolean;
}

export class SAXMusicXMLParser {
  private transposer: MusicTransposer | null = null;

  setTransposer(transposer: MusicTransposer): void {
    this.transposer = transposer;
  }

  private _transposeXMLWithSAX(
    xmlData: string,
    semitones: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parser = new SaxesParser();

      let output = "";
      const elementStack: string[] = [];
      let currentElement: string | null = null;
      let textContent = "";
      let insideHarmony = false;
      let insideKey = false;
      let insidePitch = false;
      let insideAccidental = false;

      // Current musical element data
      let noteData: Record<string, unknown> = {};
      let harmonyData: HarmonyData = {};
      let pitchBuffer = "";

      parser.on("opentag", (node: SaxesTag) => {
        elementStack.push(node.name);

        // Track what musical element we're inside
        if (node.name === "note") {
          noteData = {};
        } else if (node.name === "pitch") {
          insidePitch = true;
          pitchBuffer = "";
        } else if (node.name === "accidental") {
          insideAccidental = true;
        } else if (node.name === "harmony") {
          insideHarmony = true;
          harmonyData = {};
        } else if (node.name === "key") {
          insideKey = true;
        }

        // Store element data for transposition
        if (insidePitch && ["step", "alter", "octave"].includes(node.name)) {
          currentElement = node.name;
        } else if (
          insideHarmony &&
          ["root-step", "root-alter", "bass-step", "bass-alter"].includes(
            node.name
          )
        ) {
          currentElement = node.name;
        } else if (insideKey && node.name === "fifths") {
          currentElement = node.name;
        } else {
          currentElement = null;
        }

        // Buffer pitch elements, write others immediately
        if (insidePitch) {
          let tag = "<" + node.name;
          for (const attr in node.attributes) {
            tag += ` ${attr}="${node.attributes[attr]}"`;
          }
          tag += ">";
          pitchBuffer += tag;
        } else {
          // Write opening tag with attributes
          let tag = "<" + node.name;
          for (const attr in node.attributes) {
            tag += ` ${attr}="${node.attributes[attr]}"`;
          }
          tag += ">";
          output += tag;
        }

        textContent = "";
      });

      parser.on("text", (text: string) => {
        textContent += text;
      });

      parser.on("closetag", (tag) => {
        const tagName = tag.name;
        // Handle pitch element buffering and transposition
        if (insidePitch) {
          if (currentElement && textContent.trim()) {
            const originalValue = textContent.trim();
            noteData[currentElement] = originalValue;

            // Store pitch element data
            if (currentElement === "step") {
              noteData.step = originalValue;
            } else if (currentElement === "alter") {
              noteData.alter = parseInt(originalValue);
            } else if (currentElement === "octave") {
              noteData.octave = parseInt(originalValue);
            }

            pitchBuffer += originalValue;
          } else {
            pitchBuffer += textContent;
          }

          // Don't add closing tag to buffer for pitch element itself
          if (tagName !== "pitch") {
            pitchBuffer += "</" + tagName + ">";
          }

          // When pitch element closes, transpose and output
          if (tagName === "pitch") {
            if (noteData.step && this.transposer) {
              const step = noteData.step;
              const alter = noteData.alter || 0;
              const octave = noteData.octave || 4;

              const transposed = this.transposer.transposeNote(
                step as string,
                alter as number,
                octave as number,
                semitones
              );

              // Store transposed alter for accidental handling
              noteData.transposedAlter =
                transposed.alter !== undefined ? parseInt(transposed.alter) : 0;

              // Build transposed pitch element
              let transposedPitch = "<pitch>";
              transposedPitch += `<step>${transposed.step}</step>`;
              if (transposed.alter !== undefined) {
                transposedPitch += `<alter>${transposed.alter}</alter>`;
              }
              transposedPitch += `<octave>${transposed.octave}</octave>`;
              transposedPitch += "</pitch>";

              output += transposedPitch;
            } else {
              output += pitchBuffer;
            }

            insidePitch = false;
            pitchBuffer = "";
          }
        } else if (
          insideAccidental &&
          tagName === "accidental" &&
          textContent.trim()
        ) {
          // Handle accidental transposition based on transposed alter value
          const originalAccidental = textContent.trim();
          let transposedAccidental = originalAccidental;

          if (noteData.transposedAlter !== undefined) {
            // Map alter values to accidental names
            if (noteData.transposedAlter === 1) {
              transposedAccidental = "sharp";
            } else if (noteData.transposedAlter === -1) {
              transposedAccidental = "flat";
            } else if (noteData.transposedAlter === 0) {
              transposedAccidental = "natural";
            } else if (noteData.transposedAlter === 2) {
              transposedAccidental = "double-sharp";
            } else if (noteData.transposedAlter === -2) {
              transposedAccidental = "double-flat";
            }
          }

          output += transposedAccidental;
        } else if (currentElement && textContent.trim() && this.transposer) {
          // Handle non-pitch transposition
          const originalValue = textContent.trim();
          let transposedValue = originalValue;

          if (insideHarmony && currentElement === tagName) {
            harmonyData[currentElement] = originalValue;

            if (currentElement === "root-step") {
              const transposed = this.transposer.transposeNote(
                originalValue,
                0,
                4,
                semitones
              );
              transposedValue = transposed.step;
              harmonyData._transposedRoot = transposed;
              harmonyData._needsRootAlter = transposed.alter !== undefined;
              harmonyData._hasOriginalRootAlter = false; // Will be set to true if we see root-alter
            } else if (currentElement === "root-alter") {
              const step = harmonyData["root-step"] || "C";
              const transposed = this.transposer.transposeNote(
                step as string,
                parseInt(originalValue),
                4,
                semitones
              );
              harmonyData._transposedRoot = transposed;
              harmonyData._hasOriginalRootAlter = true; // Mark that original had root-alter
              harmonyData._needsRootAlter = false; // Don't add another

              // Need to update the root-step in the output since we have the complete transposed note
              harmonyData._updateRootStep = true;

              if (transposed.alter !== undefined) {
                transposedValue = transposed.alter.toString();
              } else {
                // Don't output this element - mark to remove it from output
                harmonyData._removeLastRootAlter = true;
                transposedValue = originalValue; // Temporary, will be removed
              }
            } else if (currentElement === "bass-step") {
              const transposed = this.transposer.transposeNote(
                originalValue,
                0,
                4,
                semitones
              );
              transposedValue = transposed.step;
              harmonyData._transposedBass = transposed;
              harmonyData._needsBassAlter = transposed.alter !== undefined;
              harmonyData._hasOriginalBassAlter = false; // Will be set to true if we see bass-alter
            } else if (currentElement === "bass-alter") {
              const step = harmonyData["bass-step"] || "C";
              const transposed = this.transposer.transposeNote(
                step as string,
                parseInt(originalValue),
                4,
                semitones
              );
              harmonyData._transposedBass = transposed;
              harmonyData._hasOriginalBassAlter = true; // Mark that original had bass-alter
              harmonyData._needsBassAlter = false; // Don't add another

              if (transposed.alter !== undefined) {
                transposedValue = transposed.alter.toString();
              } else {
                // Don't output this element - mark to remove it from output
                harmonyData._removeLastBassAlter = true;
                transposedValue = originalValue; // Temporary, will be removed
              }
            }
          } else if (insideKey && currentElement === "fifths") {
            const currentFifths = parseInt(originalValue);

            // Create mapping from semitone transposition to fifths changes
            // Using the circle of fifths: C(0) G(1) D(2) A(3) E(4) B(5) F#(6) C#(7) / F(-1) Bb(-2) Eb(-3) Ab(-4) Db(-5) Gb(-6) Cb(-7)
            const semitonesToFifthsMap = [
              0, // 0 semitones: C → C (0)
              7, // 1 semitone:  C → Db (-5), but prefer C → C# (7)
              2, // 2 semitones: C → D (2)
              -3, // 3 semitones: C → Eb (-3)
              4, // 4 semitones: C → E (4)
              -1, // 5 semitones: C → F (-1)
              6, // 6 semitones: C → F# (6) or Gb (-6) - prefer F# (6)
              1, // 7 semitones: C → G (1)
              -4, // 8 semitones: C → Ab (-4)
              3, // 9 semitones: C → A (3)
              -2, // 10 semitones: C → Bb (-2)
              5, // 11 semitones: C → B (5)
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
        if (!insidePitch || tagName === "pitch") {
          // Don't write closing tag for pitch element as it's handled in the pitch logic
          if (tagName !== "pitch") {
            output += "</" + tagName + ">";
          }
        }

        // Handle alter elements when root or bass elements close
        if (insideHarmony && tagName === "root") {
          if (harmonyData._updateRootStep && harmonyData._transposedRoot) {
            // Update the root-step in the output with the correctly transposed step
            const rootStepPattern = /<root-step>([A-G])<\/root-step>/;
            output = output.replace(
              rootStepPattern,
              `<root-step>${harmonyData._transposedRoot.step}</root-step>`
            );
          }

          if (harmonyData._removeLastRootAlter) {
            // Remove the unwanted root-alter element that was just added
            const rootAlterPattern = /<root-alter>.*?<\/root-alter>/;
            output = output.replace(rootAlterPattern, "");
          } else if (
            harmonyData._needsRootAlter &&
            !harmonyData._hasOriginalRootAlter &&
            harmonyData._transposedRoot &&
            harmonyData._transposedRoot.alter !== undefined
          ) {
            // Insert root-alter before closing root
            const pos = output.lastIndexOf("</root>");
            if (pos !== -1) {
              output =
                output.substring(0, pos) +
                `<root-alter>${harmonyData._transposedRoot.alter}</root-alter>` +
                output.substring(pos);
            }
          }
        } else if (insideHarmony && tagName === "bass") {
          if (harmonyData._removeLastBassAlter) {
            // Remove the unwanted bass-alter element that was just added
            const bassAlterPattern = /<bass-alter>.*?<\/bass-alter>/;
            output = output.replace(bassAlterPattern, "");
          } else if (
            harmonyData._needsBassAlter &&
            !harmonyData._hasOriginalBassAlter &&
            harmonyData._transposedBass &&
            harmonyData._transposedBass.alter !== undefined
          ) {
            // Insert bass-alter before closing bass
            const pos = output.lastIndexOf("</bass>");
            if (pos !== -1) {
              output =
                output.substring(0, pos) +
                `<bass-alter>${harmonyData._transposedBass.alter}</bass-alter>` +
                output.substring(pos);
            }
          }
        }

        // Reset state when exiting musical elements
        if (tagName === "note") {
          noteData = {};
        } else if (tagName === "accidental") {
          insideAccidental = false;
        } else if (tagName === "harmony") {
          insideHarmony = false;
          harmonyData = {};
        } else if (tagName === "key") {
          insideKey = false;
        }

        elementStack.pop();
        currentElement = null;
        textContent = "";
      });

      parser.on("error", (err: Error) => {
        reject(new Error(`SAX parsing error: ${err.message}`));
      });

      parser.on("end", () => {
        resolve(output);
      });

      try {
        parser.write(xmlData).close();
      } catch (error) {
        reject(error);
      }
    });
  }

  async transposeByInterval(xmlData: string, interval: string): Promise<string> {
    if (!this.transposer) {
      throw new Error("Transposer not set");
    }

    try {
      // Extract and preserve XML declaration and DOCTYPE
      const xmlDeclarationMatch = xmlData.match(/^<\?xml[^>]*\?>\s*/);
      const doctypeMatch = xmlData.match(/<!DOCTYPE[^>]*>/);

      let output = "";
      if (xmlDeclarationMatch) {
        output += xmlDeclarationMatch[0];
      }
      if (doctypeMatch) {
        output += doctypeMatch[0] + "\n";
      }

      // Remove XML declaration and DOCTYPE from data for SAX parsing
      let cleanXmlData = xmlData;
      if (xmlDeclarationMatch) {
        cleanXmlData = cleanXmlData.replace(xmlDeclarationMatch[0], "");
      }
      if (doctypeMatch) {
        cleanXmlData = cleanXmlData.replace(doctypeMatch[0], "");
      }
      cleanXmlData = cleanXmlData.trim();

      // Use shared parsing method
      const semitones = this.transposer.parseInterval(interval);
      const transposedXML = await this._transposeXMLWithSAX(
        cleanXmlData,
        semitones
      );

      output += transposedXML;
      return output;
    } catch (error) {
      throw new Error(
        `Failed to process MusicXML: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }


  // Returns separate MusicXML strings for all 12 keys
  async transposeToAllKeys(
    xmlData: string, 
    keyOrder: 'chromatic' | 'fourths' = 'chromatic'
  ): Promise<Array<{ key: string; semitones: number; xml: string }>> {
    if (!this.transposer) {
      throw new Error("Transposer not set");
    }

    try {
      // Extract the original key signature from the XML
      const originalKeyInfo = this._extractOriginalKeySignature(xmlData);
      
      // Extract XML declaration and DOCTYPE
      const xmlDeclarationMatch = xmlData.match(/^<\?xml[^>]*\?>\s*/);
      const doctypeMatch = xmlData.match(/<!DOCTYPE[^>]*>/);

      let headerOutput = "";
      if (xmlDeclarationMatch) {
        headerOutput += xmlDeclarationMatch[0];
      }
      if (doctypeMatch) {
        headerOutput += doctypeMatch[0] + "\n";
      }

      // Remove XML declaration and DOCTYPE for processing
      let cleanXmlData = xmlData;
      if (xmlDeclarationMatch) {
        cleanXmlData = cleanXmlData.replace(xmlDeclarationMatch[0], "");
      }
      if (doctypeMatch) {
        cleanXmlData = cleanXmlData.replace(doctypeMatch[0], "");
      }
      cleanXmlData = cleanXmlData.trim();

      // Define key orders
      const chromaticOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const fourthsOrder = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];
      
      const keySequence = keyOrder === 'fourths' ? fourthsOrder : chromaticOrder;
      const results: Array<{ key: string; semitones: number; xml: string }> = [];

      // Generate separate transposed versions for each key
      for (let keyIndex = 0; keyIndex < 12; keyIndex++) {
        const semitones = keySequence[keyIndex];
        
        // Calculate the transposed key signature
        const transposedKeyName = this._calculateTransposedKeyName(originalKeyInfo, semitones);
        
        // Transpose for this specific key
        const transposedXML = await this._transposeXMLWithSAX(cleanXmlData, semitones);
        const fullXML = headerOutput + transposedXML;
        
        results.push({
          key: transposedKeyName,
          semitones: semitones,
          xml: fullXML
        });
      }

      return results;
    } catch (error) {
      throw new Error(
        `Failed to transpose to separate keys: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private _extractOriginalKeySignature(xmlData: string): { fifths: number; mode: string } {
    // Extract the first key signature from the XML
    const keyMatch = xmlData.match(/<key[^>]*>(.*?)<\/key>/s);
    if (!keyMatch) {
      return { fifths: 0, mode: 'major' }; // Default to C major
    }
    
    const keyContent = keyMatch[1];
    const fifthsMatch = keyContent.match(/<fifths>([^<]+)<\/fifths>/);
    const modeMatch = keyContent.match(/<mode>([^<]+)<\/mode>/);
    
    const fifths = fifthsMatch ? parseInt(fifthsMatch[1]) : 0;
    const mode = modeMatch ? modeMatch[1] : 'major';
    
    return { fifths, mode };
  }

  private _calculateTransposedKeyName(originalKey: { fifths: number; mode: string }, semitones: number): string {
    if (!this.transposer) {
      return 'C';
    }

    // Create a key element compatible with the transposer
    const keyElement: { fifths: string } = { fifths: originalKey.fifths.toString() };
    
    // Use the existing transposeKeySignature method
    const transposedKey = this.transposer.transposeKeySignature(keyElement, semitones);
    const transposedFifths = parseInt(transposedKey.fifths as string);
    
    // Convert fifths + mode to key name
    return this._fifthsToKeyName(transposedFifths, originalKey.mode);
  }

  private _fifthsToKeyName(fifths: number, mode: string): string {
    // Circle of fifths mapping based on MusicXML standard
    // Positive fifths = sharps, Negative fifths = flats
    
    const majorKeysByFifths: { [key: number]: string } = {
      // Sharp keys (positive fifths)
      0: 'C',    // 0 sharps
      1: 'G',    // 1 sharp
      2: 'D',    // 2 sharps
      3: 'A',    // 3 sharps
      4: 'E',    // 4 sharps
      5: 'B',    // 5 sharps
      6: 'F♯',   // 6 sharps
      7: 'C♯',   // 7 sharps
      // Flat keys (negative fifths)
      [-1]: 'F',    // 1 flat
      [-2]: 'B♭',   // 2 flats
      [-3]: 'E♭',   // 3 flats
      [-4]: 'A♭',   // 4 flats
      [-5]: 'D♭',   // 5 flats
      [-6]: 'G♭',   // 6 flats
      [-7]: 'C♭'    // 7 flats
    };

    const minorKeysByFifths: { [key: number]: string } = {
      // Sharp keys (positive fifths) - relative minors
      0: 'A',    // 0 sharps (relative to C major)
      1: 'E',    // 1 sharp (relative to G major)
      2: 'B',    // 2 sharps (relative to D major)
      3: 'F♯',   // 3 sharps (relative to A major)
      4: 'C♯',   // 4 sharps (relative to E major)
      5: 'G♯',   // 5 sharps (relative to B major)
      6: 'D♯',   // 6 sharps (relative to F♯ major)
      7: 'A♯',   // 7 sharps (relative to C♯ major)
      // Flat keys (negative fifths) - relative minors
      [-1]: 'D',    // 1 flat (relative to F major)
      [-2]: 'G',    // 2 flats (relative to B♭ major)
      [-3]: 'C',    // 3 flats (relative to E♭ major)
      [-4]: 'F',    // 4 flats (relative to A♭ major)
      [-5]: 'B♭',   // 5 flats (relative to D♭ major)
      [-6]: 'E♭',   // 6 flats (relative to G♭ major)
      [-7]: 'A♭'    // 7 flats (relative to C♭ major)
    };
    
    // Clamp fifths to valid range (-7 to +7)
    const clampedFifths = Math.max(-7, Math.min(7, fifths));
    
    const keys = mode.toLowerCase() === 'minor' ? minorKeysByFifths : majorKeysByFifths;
    const keyName = keys[clampedFifths] || 'C'; // Default to C if not found
    const suffix = mode.toLowerCase() === 'minor' ? ' minor' : ' major';
    
    return keyName + suffix;
  }
}
