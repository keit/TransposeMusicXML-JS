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
    if (!noteElement.pitch || !noteElement.pitch[0]) {
      return noteElement;
    }
    
    const pitch = noteElement.pitch[0];
    const step = pitch.step ? pitch.step[0] : 'C';
    const alter = pitch.alter ? parseInt(pitch.alter[0]) : 0;
    const octave = pitch.octave ? parseInt(pitch.octave[0]) : 4;
    
    const transposed = this.transposeNote(step, alter, octave, semitones);
    
    noteElement.pitch[0].step = [transposed.step];
    noteElement.pitch[0].octave = [transposed.octave.toString()];
    
    if (transposed.alter !== undefined) {
      noteElement.pitch[0].alter = [transposed.alter];
    } else {
      delete noteElement.pitch[0].alter;
    }
    
    return noteElement;
  }

  transposeKeySignature(keyElement, semitones) {
    if (!keyElement.fifths || !keyElement.fifths[0]) {
      return keyElement;
    }
    
    const currentFifths = parseInt(keyElement.fifths[0]);
    
    // Simple approach: each semitone up moves 7 positions in circle of fifths
    // But we need to map this correctly to the actual key signatures
    // F(-1) + 2 semitones = G(+1), so +2 semitones = +2 in fifths
    let newFifths = currentFifths + semitones;
    
    // Wrap around the circle of fifths (valid range is -7 to +7)
    while (newFifths > 7) newFifths -= 12;
    while (newFifths < -7) newFifths += 12;
    
    keyElement.fifths[0] = newFifths.toString();
    return keyElement;
  }

  transposeMusicXML(musicXMLObject, intervalString) {
    const semitones = this.parseInterval(intervalString);
    
    const traverseAndTranspose = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => traverseAndTranspose(item));
      } else if (typeof obj === 'object' && obj !== null) {
        if (obj.note) {
          obj.note = obj.note.map(note => this.transposeNoteElement(note, semitones));
        }
        
        if (obj.key) {
          obj.key = obj.key.map(key => this.transposeKeySignature(key, semitones));
        }
        
        for (let key in obj) {
          obj[key] = traverseAndTranspose(obj[key]);
        }
      }
      return obj;
    };
    
    return traverseAndTranspose(musicXMLObject);
  }
}

module.exports = MusicTransposer;