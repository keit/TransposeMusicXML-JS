import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ExportButton } from './ExportButton';

interface MusicDisplayProps {
  musicXML: string | null;
  title?: string;
  showPdfExport?: boolean;
}

export const MusicDisplay: React.FC<MusicDisplayProps> = ({ 
  musicXML, 
  title, 
  showPdfExport = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportError = (errorMessage: string) => {
    setError(errorMessage);
  };

  useEffect(() => {
    if (!containerRef.current || !musicXML) {
      return;
    }

    const initializeOSMD = async () => {
      setLoading(true);
      setError(null);

      try {
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Initialize OSMD
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current as HTMLElement, {
          autoResize: true,
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
          drawPartNames: true,
          drawCredits: true,
          backend: 'svg',
        });

        // Load and render the music
        await osmdRef.current.load(musicXML);
        osmdRef.current.render();
        
        setLoading(false);
      } catch (err) {
        console.error('Error rendering music:', err);
        setError(err instanceof Error ? err.message : 'Failed to render music');
        setLoading(false);
      }
    };

    initializeOSMD();
  }, [musicXML]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (osmdRef.current && !loading) {
        setTimeout(() => {
          try {
            osmdRef.current?.render();
          } catch (err) {
            console.warn('Error during resize render:', err);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading]);

  if (!musicXML) {
    return (
      <div className="music-display-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">🎼</div>
          <p>Upload a MusicXML file to see the score here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-display">
      {title && (
        <div className="music-header">
          <h3 className="music-title">{title}</h3>
          {showPdfExport && !loading && !error && (
            <ExportButton
              containerRef={containerRef}
              osmdRef={osmdRef}
              title={title}
              disabled={loading}
              onError={handleExportError}
            />
          )}
        </div>
      )}
      
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading and rendering score...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <h4>Error rendering music:</h4>
          <p>{error}</p>
          <details>
            <summary>Technical details</summary>
            <pre>{error}</pre>
          </details>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="osmd-container"
        style={{ 
          minHeight: loading ? '400px' : 'auto',
          position: 'relative'
        }}
      />
    </div>
  );
};