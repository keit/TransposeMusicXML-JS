import * as Tone from "tone";
import PianoMp3 from "tonejs-instrument-piano-mp3";
import {
  MusicXMLPlaybackParser,
  type PlayableNote,
} from "../lib/MusicXMLPlaybackParser";

export interface PlaybackOptions {
  bpm?: number;
  transposingInstrument?: "concert" | "bb" | "eb";
  swing?: boolean;
}

export class MusicPlaybackService {
  private pianoInstance: PianoMp3 | null = null;
  private parser: MusicXMLPlaybackParser;
  private currentSequence: PlayableNote[] = [];
  private isPlaying = false;
  private scheduledTimeouts: number[] = [];

  constructor() {
    this.parser = new MusicXMLPlaybackParser();
    this.initializePiano();
  }

  private async initializePiano(): Promise<void> {
    try {
      this.pianoInstance = new PianoMp3({
        minify: true,
        onload: () => {
          console.log("Piano samples loaded for playback service");

          // Connect to audio output with some reverb for better sound
          if (this.pianoInstance) {
            const reverb = new Tone.Reverb({
              decay: 1.5,
              preDelay: 0.01,
              wet: 0.2,
            });
            this.pianoInstance.chain(reverb, Tone.getDestination());
          }
        },
      });
    } catch (error) {
      console.error("Failed to initialize piano for playback:", error);
    }
  }

  async parseAndPrepare(musicXML: string): Promise<void> {
    try {
      // Clean XML data (remove declaration/DOCTYPE like the SAX parser does)
      let cleanXmlData = musicXML;
      const xmlDeclarationMatch = musicXML.match(/^<\?xml[^>]*\?>\s*/);
      const doctypeMatch = musicXML.match(/<!DOCTYPE[^>]*>/);

      if (xmlDeclarationMatch) {
        cleanXmlData = cleanXmlData.replace(xmlDeclarationMatch[0], "");
      }
      if (doctypeMatch) {
        cleanXmlData = cleanXmlData.replace(doctypeMatch[0], "");
      }
      cleanXmlData = cleanXmlData.trim();

      this.currentSequence = await this.parser.parseForPlayback(cleanXmlData);
      console.log(`Parsed ${this.currentSequence.length} notes for playback`);
    } catch (error) {
      console.error("Failed to parse MusicXML for playback:", error);
      throw error;
    }
  }

  async play(options: PlaybackOptions = {}): Promise<void> {
    if (!this.pianoInstance) {
      throw new Error("Piano not initialized");
    }

    if (this.currentSequence.length === 0) {
      throw new Error("No music sequence loaded");
    }

    if (this.isPlaying) {
      this.stop();
    }

    // Ensure Tone.js is started
    if (Tone.getContext().state !== "running") {
      await Tone.start();
    }

    this.isPlaying = true;

    // Apply options to the sequence
    const processedSequence = this.applyPlaybackOptions(
      this.currentSequence,
      options
    );

    // Schedule all notes using setTimeout and track them for cancellation
    processedSequence.forEach((note) => {
      const timeoutId = setTimeout(() => {
        if (this.isPlaying && this.pianoInstance) {
          try {
            // Use triggerAttackRelease with note, duration, and current time
            this.pianoInstance.triggerAttackRelease(
              note.pitch,
              note.duration,
              Tone.now()
            );
          } catch (error) {
            console.warn(`Failed to play note ${note.pitch}:`, error);
          }
        }
      }, note.startTime * 1000); // Convert to milliseconds

      this.scheduledTimeouts.push(timeoutId);
    });

    // Schedule stop at the end
    const totalDuration = Math.max(
      ...processedSequence.map((n) => n.startTime + n.duration)
    );
    setTimeout(() => {
      if (this.isPlaying) {
        this.stop();
      }
    }, (totalDuration + 1) * 1000); // Add 1 second buffer
  }

  stop(): void {
    this.isPlaying = false;

    // Clear all scheduled timeouts to prevent further notes from playing
    this.scheduledTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledTimeouts = [];
  }

  private applyPlaybackOptions(
    sequence: PlayableNote[],
    options: PlaybackOptions
  ): PlayableNote[] {
    let processedSequence = [...sequence];

    // Apply transposing instrument transposition
    if (
      options.transposingInstrument &&
      options.transposingInstrument !== "concert"
    ) {
      processedSequence = this.transposeSequence(
        processedSequence,
        options.transposingInstrument
      );
    }

    // Apply swing timing
    if (options.swing) {
      processedSequence = this.applySwing(processedSequence);
    }

    // Apply tempo scaling based on BPM
    if (options.bpm && options.bpm !== 120) {
      processedSequence = this.applyTempoScaling(
        processedSequence,
        options.bpm
      );
    }

    return processedSequence;
  }

  private transposeSequence(
    sequence: PlayableNote[],
    instrument: "bb" | "eb"
  ): PlayableNote[] {
    // Bb instruments sound a major second lower, so we transpose down a major second (-2 semitones)
    // Eb instruments should play a minor third higher (+3 semitones)
    const semitones = instrument === "bb" ? -2 : 3;

    return sequence.map((note) => ({
      ...note,
      pitch: this.transposePitch(note.pitch, semitones),
    }));
  }

  private transposePitch(pitch: string, semitones: number): string {
    // Parse pitch string (e.g. "C4", "F#5", "Bb3")
    const match = pitch.match(/^([A-G])([#b]?)(\d+)$/);
    if (!match) {
      console.warn(`Invalid pitch format: ${pitch}`);
      return pitch;
    }

    const [, note, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr);

    // Convert to MIDI note number
    const noteValues: { [key: string]: number } = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11,
    };

    let midiNote = noteValues[note] + (octave + 1) * 12; // +1 because MIDI C4 = 60

    // Apply accidentals
    if (accidental === "#") {
      midiNote += 1;
    } else if (accidental === "b") {
      midiNote -= 1;
    }

    // Transpose
    midiNote += semitones;

    // Convert back to pitch string
    const newOctave = Math.floor(midiNote / 12) - 1; // -1 to undo the +1 above
    const noteIndex = midiNote % 12;

    // Note names with preference for sharps
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const newNote = noteNames[noteIndex];

    return newNote + newOctave;
  }

  private applySwing(sequence: PlayableNote[]): PlayableNote[] {
    // Apply swing rhythm (8th note swing)
    // In swing, the first of each pair of 8th notes is lengthened, the second is shortened and delayed

    // This is a simplified swing implementation
    // We need to identify 8th note pairs and apply the swing timing

    return sequence.map((note, index) => {
      // Simple swing: if this is an even-indexed note (in pairs), delay it slightly
      if (index > 0) {
        const prevNote = sequence[index - 1];
        const timeDiff = note.startTime - prevNote.startTime;

        // If notes are close together (likely 8th notes), apply swing
        if (timeDiff > 0 && timeDiff < 0.5) {
          // Less than half a second apart
          const swingRatio = 0.67; // 2:1 swing ratio
          const swingDelay = timeDiff * (1 - swingRatio) * 0.5;

          return {
            ...note,
            startTime: note.startTime + swingDelay,
          };
        }
      }

      return note;
    });
  }

  private applyTempoScaling(
    sequence: PlayableNote[],
    bpm: number
  ): PlayableNote[] {
    // Default BPM is 120, so calculate scaling factor
    const scalingFactor = 120 / bpm;

    return sequence.map((note) => ({
      ...note,
      startTime: note.startTime * scalingFactor,
      duration: note.duration * scalingFactor,
    }));
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentSequenceLength(): number {
    return this.currentSequence.length;
  }

  getTotalDuration(): number {
    if (this.currentSequence.length === 0) return 0;
    return Math.max(
      ...this.currentSequence.map((n) => n.startTime + n.duration)
    );
  }
}
