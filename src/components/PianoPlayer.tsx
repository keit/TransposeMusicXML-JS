import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import PianoMp3 from 'tonejs-instrument-piano-mp3';

interface PianoPlayerProps {
  className?: string;
}

export const PianoPlayer: React.FC<PianoPlayerProps> = ({ className = '' }) => {
  const [piano, setPiano] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pianoRef = useRef<any | null>(null);

  // Initialize sample-based piano on component mount
  useEffect(() => {
    const initializePiano = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create piano using correct tonejs-instrument-piano-mp3 pattern
        const pianoInstance = new PianoMp3({
          minify: true, // Use smaller sample set for faster loading
          onload: () => {
            console.log('Piano samples loaded successfully');
            setIsReady(true);
            setIsLoading(false);
          }
        });

        // Add some reverb for more realistic sound
        const reverb = new Tone.Reverb({
          decay: 1.8,
          preDelay: 0.01,
          wet: 0.3,
        });

        // Connect to destination through reverb
        pianoInstance.chain(reverb, Tone.getDestination());
        
        pianoRef.current = pianoInstance;
        setPiano(pianoInstance);
        
      } catch (err) {
        console.error('Failed to initialize piano:', err);
        setError('Failed to initialize piano');
        setIsLoading(false);
      }
    };

    initializePiano();

    // Cleanup on unmount
    return () => {
      if (pianoRef.current) {
        pianoRef.current.dispose();
      }
    };
  }, []);

  const playTestMelody = async () => {
    if (!piano || !isReady) {
      console.warn('Piano not ready yet');
      return;
    }

    try {
      // Start audio context if needed
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      // Simple test melody - C major scale arpeggio
      const notes = [
        { note: 'C4', time: 0, duration: '8n' },
        { note: 'E4', time: '8n', duration: '8n' },
        { note: 'G4', time: '4n', duration: '8n' },
        { note: 'C5', time: '4n + 8n', duration: '8n' },
        { note: 'G4', time: '2n', duration: '8n' },
        { note: 'E4', time: '2n + 8n', duration: '8n' },
        { note: 'C4', time: '2n + 4n', duration: '4n' }
      ];

      const now = Tone.now();
      notes.forEach((noteData) => {
        const time = now + Tone.Time(noteData.time).toSeconds();
        piano.triggerAttackRelease(noteData.note, noteData.duration, time);
      });
    } catch (err) {
      console.error('Failed to play melody:', err);
      setError('Failed to play audio');
    }
  };

  const playJazzLick = async () => {
    if (!piano || !isReady) {
      console.warn('Piano not ready yet');
      return;
    }

    try {
      // Start audio context if needed
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      // Simple jazz lick in C major (ii-V-I progression)
      const notes = [
        { note: 'D4', time: 0, duration: '16n' },
        { note: 'F4', time: '16n', duration: '16n' },
        { note: 'A4', time: '8n', duration: '16n' },
        { note: 'C5', time: '8n + 16n', duration: '16n' },
        { note: 'B4', time: '4n', duration: '16n' },
        { note: 'G4', time: '4n + 16n', duration: '16n' },
        { note: 'F4', time: '4n + 8n', duration: '16n' },
        { note: 'E4', time: '4n + 8n + 16n', duration: '8n' },
        { note: 'C4', time: '2n', duration: '4n' }
      ];

      const now = Tone.now();
      notes.forEach((noteData) => {
        const time = now + Tone.Time(noteData.time).toSeconds();
        piano.triggerAttackRelease(noteData.note, noteData.duration, time);
      });
    } catch (err) {
      console.error('Failed to play jazz lick:', err);
      setError('Failed to play audio');
    }
  };

  return (
    <div className={`piano-player ${className}`}>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          {isLoading && 'Loading piano samples...'}
          {error && <span className="text-red-600">{error}</span>}
          {isReady && 'Real piano samples ready!'}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={playTestMelody}
            disabled={!isReady || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play Test Melody
          </button>
          
          <button
            onClick={playJazzLick}
            disabled={!isReady || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play Jazz Lick
          </button>
        </div>
        
        {isReady && (
          <div className="text-xs text-gray-500">
            Click buttons above to test real piano sample playback
          </div>
        )}
      </div>
    </div>
  );
};