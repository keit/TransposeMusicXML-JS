import React, { useState } from 'react';

interface PlaybackControlsProps {
  className?: string;
  onBpmChange?: (bpm: number) => void;
  onInstrumentChange?: (instrument: 'concert' | 'bb' | 'eb') => void;
  onSwingChange?: (swing: boolean) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ 
  className = '',
  onBpmChange,
  onInstrumentChange, 
  onSwingChange
}) => {
  const [bpm, setBpm] = useState(120);
  const [instrument, setInstrument] = useState<'concert' | 'bb' | 'eb'>('concert');
  const [swing, setSwing] = useState(false);

  const handleBpmChange = (value: number) => {
    setBpm(value);
    onBpmChange?.(value);
  };

  const handleInstrumentChange = (value: 'concert' | 'bb' | 'eb') => {
    setInstrument(value);
    onInstrumentChange?.(value);
  };

  const handleSwingChange = (value: boolean) => {
    setSwing(value);
    onSwingChange?.(value);
  };

  return (
    <div className={`playback-controls ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">🎵 Playback Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BPM Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tempo (BPM)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <input
                type="number"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Transposing Instrument */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Instrument Type
            </label>
            <select
              value={instrument}
              onChange={(e) => handleInstrumentChange(e.target.value as 'concert' | 'bb' | 'eb')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="concert">Concert Pitch (C)</option>
              <option value="bb">B♭ Instrument (Trumpet, Tenor Sax)</option>
              <option value="eb">E♭ Instrument (Alto Sax, Bari Sax)</option>
            </select>
          </div>

          {/* Swing Toggle */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rhythm Feel
            </label>
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={swing}
                  onChange={(e) => handleSwingChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {swing ? 'Swing Feel' : 'Straight Feel'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {instrument === 'concert' && 'Concert pitch - no transposition'}
          {instrument === 'bb' && 'B♭ instruments sound a major 2nd lower than written'}
          {instrument === 'eb' && 'E♭ instruments sound a major 6th lower than written'}
        </div>
      </div>
    </div>
  );
};