import React, { useState } from 'react';

interface TranspositionControlsProps {
  onTranspose: (interval: string | null) => void;
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
      onTranspose(null); // null means all keys
    } else {
      onTranspose(interval);
    }
  };

  return (
    <div className="transposition-controls">
      <h3>Transposition Options</h3>
      
      <div className="mode-selection">
        <label className="radio-option">
          <input
            type="radio"
            name="mode"
            value="all"
            checked={mode === 'all'}
            onChange={(e) => setMode(e.target.value as 'all')}
            disabled={disabled}
          />
          <span>All 12 Keys</span>
        </label>
        
        <label className="radio-option">
          <input
            type="radio"
            name="mode"
            value="single"
            checked={mode === 'single'}
            onChange={(e) => setMode(e.target.value as 'single')}
            disabled={disabled}
          />
          <span>Single Interval</span>
        </label>
      </div>

      {mode === 'single' && (
        <div className="interval-selection">
          <label htmlFor="interval-select">Select Interval:</label>
          <select
            id="interval-select"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            disabled={disabled}
            className="interval-select"
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
        <div className="all-keys-info">
          <p>This will create a score with the melody transposed to all 12 chromatic keys.</p>
        </div>
      )}

      <button
        onClick={handleTranspose}
        disabled={disabled || loading}
        className="transpose-button"
      >
        {loading ? 'Transposing...' : 'Transpose'}
      </button>
    </div>
  );
};