import { SaxesParser, type SaxesTag } from "saxes";

export interface PlayableNote {
  pitch: string; // e.g. "C4", "F#5", "Bb3"
  startTime: number; // Time in seconds when note starts
  duration: number; // Duration in seconds
  velocity: number; // MIDI velocity (0-127)
}

export interface TimeSignature {
  numerator: number; // beats per measure
  denominator: number; // note value that gets the beat (4 = quarter note)
  divisions: number; // divisions per quarter note
}

export interface TempoMarking {
  bpm: number;
  beatNote: number; // which note value gets the beat (4 = quarter note)
}

export class MusicXMLPlaybackParser {
  private currentTime = 0;
  private currentTempo: TempoMarking = { bpm: 120, beatNote: 4 };
  private currentTimeSignature: TimeSignature = { numerator: 4, denominator: 4, divisions: 1 };
  
  async parseForPlayback(xmlData: string): Promise<PlayableNote[]> {
    return new Promise((resolve, reject) => {
      const parser = new SaxesParser();
      const notes: PlayableNote[] = [];
      
      // Reset state
      this.currentTime = 0;
      this.currentTempo = { bpm: 120, beatNote: 4 };
      this.currentTimeSignature = { numerator: 4, denominator: 4, divisions: 1 };
      
      // Parsing state
      const elementStack: string[] = [];
      let currentElement: string | null = null;
      let textContent = "";
      
      // Musical element tracking
      let insideNote = false;
      let insidePitch = false;
      let insideSound = false;
      let insideAttributes = false;
      let insideTime = false;
      
      // Current note data
      let noteData: {
        step?: string;
        alter?: number;
        octave?: number;
        duration?: number;
        velocity?: number;
        isRest?: boolean;
      } = {};

      parser.on("opentag", (node: SaxesTag) => {
        elementStack.push(node.name);
        
        // Track musical contexts
        if (node.name === "note") {
          insideNote = true;
          noteData = { velocity: 64 }; // Default velocity
        } else if (node.name === "pitch") {
          insidePitch = true;
        } else if (node.name === "rest") {
          noteData.isRest = true;
        } else if (node.name === "sound") {
          insideSound = true;
        } else if (node.name === "attributes") {
          insideAttributes = true;
        } else if (node.name === "time") {
          insideTime = true;
        }
        
        // Set current element for text capture
        if (insidePitch && ["step", "alter", "octave"].includes(node.name)) {
          currentElement = node.name;
        } else if (insideNote && node.name === "duration") {
          currentElement = "duration";
        } else if (insideNote && node.name === "velocity") {
          currentElement = "velocity";
        } else if (insideSound && node.name === "tempo") {
          currentElement = "tempo";
        } else if (insideAttributes && node.name === "divisions") {
          currentElement = "divisions";
        } else if (insideTime && ["beats", "beat-type"].includes(node.name)) {
          currentElement = node.name;
        } else {
          currentElement = null;
        }
        
        textContent = "";
      });

      parser.on("text", (text: string) => {
        textContent += text;
      });

      parser.on("closetag", (tag) => {
        const tagName = tag.name;
        
        // Capture element data
        if (currentElement && textContent.trim()) {
          const value = textContent.trim();
          
          if (currentElement === "step") {
            noteData.step = value;
          } else if (currentElement === "alter") {
            noteData.alter = parseInt(value);
          } else if (currentElement === "octave") {
            noteData.octave = parseInt(value);
          } else if (currentElement === "duration") {
            noteData.duration = parseInt(value);
          } else if (currentElement === "velocity") {
            noteData.velocity = parseInt(value);
          } else if (currentElement === "tempo") {
            // MusicXML tempo is usually in quarter notes per minute
            this.currentTempo.bpm = parseInt(value);
          } else if (currentElement === "divisions") {
            this.currentTimeSignature.divisions = parseInt(value);
          } else if (currentElement === "beats") {
            this.currentTimeSignature.numerator = parseInt(value);
          } else if (currentElement === "beat-type") {
            this.currentTimeSignature.denominator = parseInt(value);
          }
        }
        
        // Process completed musical elements
        if (tagName === "note" && insideNote) {
          if (!noteData.isRest && noteData.step && noteData.octave !== undefined) {
            // Convert to playable note
            const pitch = this.buildPitchString(noteData.step, noteData.alter || 0, noteData.octave);
            const duration = this.convertDurationToSeconds(noteData.duration || 0);
            
            notes.push({
              pitch,
              startTime: this.currentTime,
              duration,
              velocity: noteData.velocity || 64
            });
          }
          
          // Advance time by note duration
          if (noteData.duration) {
            this.currentTime += this.convertDurationToSeconds(noteData.duration);
          }
          
          // Reset note data
          noteData = {};
          insideNote = false;
        }
        
        // Reset context flags
        if (tagName === "pitch") {
          insidePitch = false;
        } else if (tagName === "sound") {
          insideSound = false;
        } else if (tagName === "attributes") {
          insideAttributes = false;
        } else if (tagName === "time") {
          insideTime = false;
        }
        
        elementStack.pop();
        currentElement = null;
        textContent = "";
      });

      parser.on("error", (err: Error) => {
        reject(new Error(`MusicXML parsing error: ${err.message}`));
      });

      parser.on("end", () => {
        // Sort notes by start time to ensure proper playback order
        notes.sort((a, b) => a.startTime - b.startTime);
        resolve(notes);
      });

      try {
        parser.write(xmlData).close();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private buildPitchString(step: string, alter: number, octave: number): string {
    let pitchName = step;
    
    // Apply alterations
    if (alter > 0) {
      pitchName += "#".repeat(alter);
    } else if (alter < 0) {
      pitchName += "b".repeat(Math.abs(alter));
    }
    
    return pitchName + octave;
  }
  
  private convertDurationToSeconds(duration: number): number {
    // MusicXML duration is in divisions per quarter note
    // Convert to seconds based on current tempo and time signature
    
    if (duration === 0) return 0;
    
    // Calculate seconds per division
    const secondsPerQuarterNote = 60 / this.currentTempo.bpm;
    const secondsPerDivision = secondsPerQuarterNote / this.currentTimeSignature.divisions;
    
    return duration * secondsPerDivision;
  }
  
  // Utility method to get total duration of the piece
  getTotalDuration(): number {
    return this.currentTime;
  }
  
  // Reset parser state for new parsing
  reset(): void {
    this.currentTime = 0;
    this.currentTempo = { bpm: 120, beatNote: 4 };
    this.currentTimeSignature = { numerator: 4, denominator: 4, divisions: 1 };
  }
}