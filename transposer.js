class MusicTransposer {
  constructor() {
    this.noteMap = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    this.numberToNote = [
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
    ];
  }

  parseInterval(interval) {
    const match = interval.match(/^([+-]?)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid interval format: ${interval}. Use format like +5, -3, or 7`);
    }
    
    const sign = match[1] === '-' ? -1 : 1;
    const semitones = parseInt(match[2]);
    return sign * semitones;
  }

  transposeNote(step, alter, octave, semitones) {
    let noteValue = this.noteMap[step] || 0;
    if (alter) {
      noteValue += parseInt(alter);
    }
    
    let totalSemitones = noteValue + (octave * 12) + semitones;
    let newOctave = Math.floor(totalSemitones / 12);
    let newNoteValue = totalSemitones % 12;
    
    if (newNoteValue < 0) {
      newNoteValue += 12;
      newOctave -= 1;
    }
    
    const newNote = this.numberToNote[newNoteValue];
    let newStep = newNote[0];
    let newAlter = 0;
    
    if (newNote.length > 1) {
      if (newNote[1] === '#') {
        newAlter = 1;
      } else if (newNote[1] === 'b') {
        newAlter = -1;
      }
    }
    
    return {
      step: newStep,
      alter: newAlter !== 0 ? newAlter.toString() : undefined,
      octave: newOctave
    };
  }

  transposeNoteElement(noteElement, semitones) {
    if (!noteElement.pitch) {
      return noteElement;
    }
    
    const pitch = Array.isArray(noteElement.pitch) ? noteElement.pitch[0] : noteElement.pitch;
    const step = Array.isArray(pitch.step) ? pitch.step[0] : pitch.step || 'C';
    const alter = pitch.alter ? (Array.isArray(pitch.alter) ? parseInt(pitch.alter[0]) : parseInt(pitch.alter)) : 0;
    const octave = pitch.octave ? (Array.isArray(pitch.octave) ? parseInt(pitch.octave[0]) : parseInt(pitch.octave)) : 4;
    
    const transposed = this.transposeNote(step, alter, octave, semitones);
    
    if (Array.isArray(noteElement.pitch)) {
      noteElement.pitch[0].step = [transposed.step];
      noteElement.pitch[0].octave = [transposed.octave.toString()];
      if (transposed.alter !== undefined) {
        noteElement.pitch[0].alter = [transposed.alter];
      } else {
        delete noteElement.pitch[0].alter;
      }
    } else {
      noteElement.pitch.step = transposed.step;
      noteElement.pitch.octave = transposed.octave.toString();
      if (transposed.alter !== undefined) {
        noteElement.pitch.alter = transposed.alter;
      } else {
        delete noteElement.pitch.alter;
      }
    }
    
    return noteElement;
  }

  transposeKeySignature(keyElement, semitones) {
    if (!keyElement.fifths) {
      return keyElement;
    }
    
    const currentFifths = Array.isArray(keyElement.fifths) ? parseInt(keyElement.fifths[0]) : parseInt(keyElement.fifths);
    
    // Simple approach: each semitone up moves 7 positions in circle of fifths
    // But we need to map this correctly to the actual key signatures
    // F(-1) + 2 semitones = G(+1), so +2 semitones = +2 in fifths
    let newFifths = currentFifths + semitones;
    
    // Wrap around the circle of fifths (valid range is -7 to +7)
    while (newFifths > 7) newFifths -= 12;
    while (newFifths < -7) newFifths += 12;
    
    if (Array.isArray(keyElement.fifths)) {
      keyElement.fifths[0] = newFifths.toString();
    } else {
      keyElement.fifths = newFifths.toString();
    }
    return keyElement;
  }

  transposeChordSymbol(chordText, semitones) {
    if (!chordText || typeof chordText !== 'string') {
      return chordText;
    }
    
    // Match chord root note (C, C#, Db, etc.) at the beginning
    const chordMatch = chordText.match(/^([A-G][b#]?)(.*)/);
    if (!chordMatch) {
      return chordText;
    }
    
    const rootNote = chordMatch[1];
    const remainder = chordMatch[2];
    
    // Transpose the root note
    const noteValue = this.noteMap[rootNote];
    if (noteValue === undefined) {
      return chordText;
    }
    
    let newNoteValue = (noteValue + semitones) % 12;
    if (newNoteValue < 0) newNoteValue += 12;
    
    const newNote = this.numberToNote[newNoteValue];
    
    return newNote + remainder;
  }

  transposeHarmonyElement(harmonyElement, semitones) {
    if (!harmonyElement.root) {
      return harmonyElement;
    }
    
    const root = Array.isArray(harmonyElement.root) ? harmonyElement.root[0] : harmonyElement.root;
    if (root.step || root['root-step']) {
      const step = root.step || root['root-step'];
      const stepValue = Array.isArray(step) ? step[0] : step;
      const alter = root.alter || root['root-alter'];
      const alterValue = alter ? (Array.isArray(alter) ? parseInt(alter[0]) : parseInt(alter)) : 0;
      
      const transposed = this.transposeNote(stepValue, alterValue, 4, semitones);
      
      if (Array.isArray(harmonyElement.root)) {
        if (harmonyElement.root[0].step) {
          harmonyElement.root[0].step = Array.isArray(harmonyElement.root[0].step) ? [transposed.step] : transposed.step;
        } else if (harmonyElement.root[0]['root-step']) {
          harmonyElement.root[0]['root-step'] = transposed.step;
        }
        
        if (transposed.alter !== undefined) {
          if (harmonyElement.root[0].alter !== undefined) {
            harmonyElement.root[0].alter = Array.isArray(harmonyElement.root[0].alter) ? [transposed.alter] : transposed.alter;
          } else if (harmonyElement.root[0]['root-alter'] !== undefined) {
            harmonyElement.root[0]['root-alter'] = transposed.alter;
          }
        } else {
          delete harmonyElement.root[0].alter;
          delete harmonyElement.root[0]['root-alter'];
        }
      } else {
        if (harmonyElement.root.step) {
          harmonyElement.root.step = transposed.step;
        } else if (harmonyElement.root['root-step']) {
          harmonyElement.root['root-step'] = transposed.step;
        }
        
        if (transposed.alter !== undefined) {
          if (harmonyElement.root.alter !== undefined) {
            harmonyElement.root.alter = transposed.alter;
          } else if (harmonyElement.root['root-alter'] !== undefined) {
            harmonyElement.root['root-alter'] = transposed.alter;
          }
        } else {
          delete harmonyElement.root.alter;
          delete harmonyElement.root['root-alter'];
        }
      }
    }
    
    // Also transpose bass note if present
    if (harmonyElement.bass) {
      const bass = Array.isArray(harmonyElement.bass) ? harmonyElement.bass[0] : harmonyElement.bass;
      if (bass.step || bass['bass-step']) {
        const bassStep = bass.step || bass['bass-step'];
        const bassStepValue = Array.isArray(bassStep) ? bassStep[0] : bassStep;
        const bassAlter = bass.alter || bass['bass-alter'];
        const bassAlterValue = bassAlter ? (Array.isArray(bassAlter) ? parseInt(bassAlter[0]) : parseInt(bassAlter)) : 0;
        
        const transposedBass = this.transposeNote(bassStepValue, bassAlterValue, 4, semitones);
        
        if (Array.isArray(harmonyElement.bass)) {
          if (harmonyElement.bass[0].step) {
            harmonyElement.bass[0].step = Array.isArray(harmonyElement.bass[0].step) ? [transposedBass.step] : transposedBass.step;
          } else if (harmonyElement.bass[0]['bass-step']) {
            harmonyElement.bass[0]['bass-step'] = transposedBass.step;
          }
          
          if (transposedBass.alter !== undefined) {
            if (harmonyElement.bass[0].alter !== undefined) {
              harmonyElement.bass[0].alter = Array.isArray(harmonyElement.bass[0].alter) ? [transposedBass.alter] : transposedBass.alter;
            } else if (harmonyElement.bass[0]['bass-alter'] !== undefined) {
              harmonyElement.bass[0]['bass-alter'] = transposedBass.alter;
            }
          } else {
            delete harmonyElement.bass[0].alter;
            delete harmonyElement.bass[0]['bass-alter'];
          }
        } else {
          if (harmonyElement.bass.step) {
            harmonyElement.bass.step = transposedBass.step;
          } else if (harmonyElement.bass['bass-step']) {
            harmonyElement.bass['bass-step'] = transposedBass.step;
          }
          
          if (transposedBass.alter !== undefined) {
            if (harmonyElement.bass.alter !== undefined) {
              harmonyElement.bass.alter = transposedBass.alter;
            } else if (harmonyElement.bass['bass-alter'] !== undefined) {
              harmonyElement.bass['bass-alter'] = transposedBass.alter;
            }
          } else {
            delete harmonyElement.bass.alter;
            delete harmonyElement.bass['bass-alter'];
          }
        }
      }
    }
    
    return harmonyElement;
  }

  transposeMusicXML(musicXMLObject, intervalString) {
    const semitones = this.parseInterval(intervalString);
    
    const traverseAndTranspose = (obj, parentKey = null) => {
      if (Array.isArray(obj)) {
        return obj.map(item => traverseAndTranspose(item, parentKey));
      } else if (typeof obj === 'object' && obj !== null) {
        // Handle individual elements based on their type
        if (parentKey === 'note' || (obj.pitch && obj.duration)) {
          return this.transposeNoteElement(obj, semitones);
        }
        
        if (parentKey === 'key' || (obj.fifths !== undefined)) {
          return this.transposeKeySignature(obj, semitones);
        }
        
        if (parentKey === 'harmony' || (obj.root && obj.kind)) {
          return this.transposeHarmonyElement(obj, semitones);
        }
        
        // Recursively traverse all other properties
        const result = {};
        for (let key in obj) {
          result[key] = traverseAndTranspose(obj[key], key);
        }
        return result;
      }
      return obj;
    };
    
    return traverseAndTranspose(musicXMLObject);
  }
}

module.exports = MusicTransposer;