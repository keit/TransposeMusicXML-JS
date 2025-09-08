import React, { useRef, useMemo } from 'react';
import { MusicDisplay } from './MusicDisplay';
import type { MusicDisplayRef } from './MusicDisplay';
import { PlayButton } from './PlayButton';
import { ExportButton } from './ExportButton';

interface MusicDisplayContainerProps {
  musicXML: string;
  title: string;
  onPlay?: () => void;
  isPlaying?: boolean;
  className?: string;
}

export const MusicDisplayContainer: React.FC<MusicDisplayContainerProps> = ({
  musicXML,
  title,
  onPlay,
  isPlaying = false,
  className = ''
}) => {
  const musicDisplayRef = useRef<MusicDisplayRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header with title and controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {onPlay && (
            <PlayButton
              onPlay={onPlay}
              isPlaying={isPlaying}
              size="medium"
            />
          )}
          <ExportButton
            containerRef={containerRef}
            osmdRef={{
              get current() {
                return musicDisplayRef.current?.getOSMD() || null;
              }
            }}
            title={title}
          />
        </div>
      </div>
      
      {/* Music display */}
      <div ref={containerRef}>
        <MusicDisplay
          ref={musicDisplayRef}
          musicXML={musicXML}
        />
      </div>
    </div>
  );
};