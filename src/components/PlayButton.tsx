import React, { useState } from 'react';

interface PlayButtonProps {
  className?: string;
  onPlay?: () => void;
  disabled?: boolean;
  isPlaying?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  className = '',
  onPlay,
  disabled = false,
  isPlaying = false,
  size = 'medium'
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      setIsPressed(true);
      onPlay?.();
      // Reset pressed state after animation
      setTimeout(() => setIsPressed(false), 150);
    }
  };

  // Size variations
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4', 
    large: 'w-5 h-5'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${className}
        inline-flex items-center justify-center
        rounded-full
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
        ${disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
          : isPlaying
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg transform scale-105'
            : isPressed
              ? 'bg-green-700 text-white shadow-inner transform scale-95'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg hover:scale-105'
        }
      `}
      title={isPlaying ? 'Stop' : 'Play'}
    >
      {isPlaying ? (
        // Stop icon (square)
        <div className={`${iconSizes[size]} bg-current`} />
      ) : (
        // Play icon (triangle)
        <svg
          className={`${iconSizes[size]} fill-current ml-0.5`}
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
};