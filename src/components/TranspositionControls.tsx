import React, { useState } from 'react';

interface TranspositionControlsProps {
  onTranspose: (interval: string | null, keyOrder?: 'chromatic' | 'fourths') => void;
  disabled?: boolean;
  loading?: boolean;
}

export const TranspositionControls: React.FC<TranspositionControlsProps> = ({ 
  onTranspose, 
  disabled, 
  loading 
}) => {
  const [mode, setMode] = useState<'single' | 'all'>('all');
  const [interval, setInterval] = useState('+5');
  const [keyOrder, setKeyOrder] = useState<'chromatic' | 'fourths'>('chromatic');

  const intervalOptions = [
    { value: '+11', label: '+11 semitones (Major 7th up)' },
    { value: '+10', label: '+10 semitones (Minor 7th up)' },
    { value: '+9', label: '+9 semitones (Major 6th up)' },
    { value: '+8', label: '+8 semitones (Minor 6th up)' },
    { value: '+7', label: '+7 semitones (Perfect 5th up)' },
    { value: '+6', label: '+6 semitones (Tritone up)' },
    { value: '+5', label: '+5 semitones (Perfect 4th up)' },
    { value: '+4', label: '+4 semitones (Major 3rd up)' },
    { value: '+3', label: '+3 semitones (Minor 3rd up)' },
    { value: '+2', label: '+2 semitones (Major 2nd up)' },
    { value: '+1', label: '+1 semitone (Minor 2nd up)' },
    { value: '0', label: '0 semitones (No change)' },
    { value: '-1', label: '-1 semitone (Minor 2nd down)' },
    { value: '-2', label: '-2 semitones (Major 2nd down)' },
    { value: '-3', label: '-3 semitones (Minor 3rd down)' },
    { value: '-4', label: '-4 semitones (Major 3rd down)' },
    { value: '-5', label: '-5 semitones (Perfect 4th down)' },
    { value: '-6', label: '-6 semitones (Tritone down)' },
    { value: '-7', label: '-7 semitones (Perfect 5th down)' },
    { value: '-8', label: '-8 semitones (Minor 6th down)' },
    { value: '-9', label: '-9 semitones (Major 6th down)' },
    { value: '-10', label: '-10 semitones (Minor 7th down)' },
    { value: '-11', label: '-11 semitones (Major 7th down)' }
  ];

  const handleTranspose = () => {
    if (mode === 'all') {
      onTranspose(null, keyOrder); // null means all keys, with key order preference
    } else {
      onTranspose(interval);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transposition Options</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            name="mode"
            value="all"
            checked={mode === 'all'}
            onChange={(e) => setMode(e.target.value as 'all')}
            disabled={disabled}
            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            id="mode-all"
          />
          <label htmlFor="mode-all" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            All 12 Keys
          </label>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            name="mode"
            value="single"
            checked={mode === 'single'}
            onChange={(e) => setMode(e.target.value as 'single')}
            disabled={disabled}
            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            id="mode-single"
          />
          <label htmlFor="mode-single" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Single Interval
          </label>
        </div>
      </div>

      {mode === 'single' && (
        <div className="space-y-3">
          <label htmlFor="interval-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Interval:
          </label>
          <select
            id="interval-select"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {intervalOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'all' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key Order:</label>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="keyOrder"
                  value="chromatic"
                  checked={keyOrder === 'chromatic'}
                  onChange={(e) => setKeyOrder(e.target.value as 'chromatic')}
                  disabled={disabled}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  id="key-order-chromatic"
                />
                <label htmlFor="key-order-chromatic" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Chromatic</span><br />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
                  </span>
                </label>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="keyOrder"
                  value="fourths"
                  checked={keyOrder === 'fourths'}
                  onChange={(e) => setKeyOrder(e.target.value as 'fourths')}
                  disabled={disabled}
                  className="w-4 h-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  id="key-order-fourths"
                />
                <label htmlFor="key-order-fourths" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Circle of Fourths</span><br />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (C, F, B♭, E♭, A♭, D♭, G♭, B, E, A, D, G)
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {keyOrder === 'chromatic' 
                ? 'Creates a score with the melody transposed to all 12 keys in chromatic order.'
                : 'Creates a score with the melody transposed to all 12 keys in circle of fourths order (useful for jazz and theory practice).'}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleTranspose}
        disabled={disabled || loading}
        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Transposing...
          </>
        ) : (
          'Transpose'
        )}
      </button>
    </div>
  );
};