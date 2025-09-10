declare module 'tonejs-instrument-piano-mp3' {
  import * as Tone from 'tone';

  interface PianoMp3Options {
    minify?: boolean;
    onload?: () => void;
  }

  class PianoMp3 extends Tone.Instrument {
    constructor(options?: PianoMp3Options);
    
    // Method to chain effects
    chain(...args: Tone.InputNode[]): this;
    
    // Method to trigger notes
    triggerAttackRelease(
      note: string | string[], 
      duration: Tone.Unit.Time, 
      time?: Tone.Unit.Time,
      velocity?: number
    ): this;
  }

  export = PianoMp3;
}