import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { OpenSheetMusicDisplay, Note } from "opensheetmusicdisplay";
import { ExportButton } from "./ExportButton";

interface MusicDisplayProps {
  musicXML: string | null;
  title?: string;
  showPdfExport?: boolean;
  enableCursor?: boolean;
}

export interface MusicDisplayRef {
  showCursor: () => void;
  hideCursor: () => void;
  nextNote: () => void;
  previousNote: () => void;
  nextMeasure: () => void;
  previousMeasure: () => void;
  resetCursor: () => void;
  getCursorNotes: () => Note[] | null;
}

export const MusicDisplay = forwardRef<MusicDisplayRef, MusicDisplayProps>(
  ({ musicXML, title, showPdfExport = true, enableCursor = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cursorVisible, setCursorVisible] = useState(false);

    const handleExportError = (errorMessage: string) => {
      setError(errorMessage);
    };

    // Expose cursor methods to parent components
    useImperativeHandle(
      ref,
      () => ({
        showCursor: () => {
          if (osmdRef.current?.cursor && enableCursor) {
            try {
              osmdRef.current.cursor.show();
              setCursorVisible(true);
            } catch (err) {
              console.warn("Error showing cursor:", err);
            }
          }
        },
        hideCursor: () => {
          if (osmdRef.current?.cursor) {
            try {
              osmdRef.current.cursor.hide();
              setCursorVisible(false);
            } catch (err) {
              console.warn("Error hiding cursor:", err);
            }
          }
        },
        nextNote: () => {
          if (osmdRef.current?.cursor && cursorVisible) {
            try {
              osmdRef.current.cursor.next();
            } catch (err) {
              console.warn("Error moving cursor to next note:", err);
            }
          }
        },
        previousNote: () => {
          if (osmdRef.current?.cursor && cursorVisible) {
            try {
              osmdRef.current.cursor.previous();
            } catch (err) {
              console.warn("Error moving cursor to previous note:", err);
            }
          }
        },
        nextMeasure: () => {
          if (osmdRef.current?.cursor && cursorVisible) {
            try {
              osmdRef.current.cursor.nextMeasure();
            } catch (err) {
              console.warn("Error moving cursor to next measure:", err);
            }
          }
        },
        previousMeasure: () => {
          if (osmdRef.current?.cursor && cursorVisible) {
            try {
              osmdRef.current.cursor.previousMeasure();
            } catch (err) {
              console.warn("Error moving cursor to previous measure:", err);
            }
          }
        },
        resetCursor: () => {
          if (osmdRef.current?.cursor) {
            try {
              osmdRef.current.cursor.reset();
            } catch (err) {
              console.warn("Error resetting cursor:", err);
            }
          }
        },
        getCursorNotes: () => {
          if (osmdRef.current?.cursor && cursorVisible) {
            try {
              return osmdRef.current.cursor.NotesUnderCursor();
            } catch (err) {
              console.warn("Error getting cursor notes:", err);
              return null;
            }
          }
          return null;
        },
      }),
      [enableCursor, cursorVisible]
    );

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
            containerRef.current.innerHTML = "";
          }

          // Initialize OSMD
          osmdRef.current = new OpenSheetMusicDisplay(
            containerRef.current as HTMLElement,
            {
              autoResize: true,
              drawTitle: true,
              drawSubtitle: true,
              drawComposer: true,
              drawPartNames: true,
              drawCredits: true,
              backend: "svg",
              disableCursor: !enableCursor,
            }
          );

          // Load and render the music
          await osmdRef.current.load(musicXML);
          osmdRef.current.render();

          setLoading(false);
        } catch (err) {
          console.error("Error rendering music:", err);
          setError(
            err instanceof Error ? err.message : "Failed to render music"
          );
          setLoading(false);
        }
      };

      initializeOSMD();
    }, [musicXML, enableCursor]);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (osmdRef.current && !loading) {
          setTimeout(() => {
            try {
              osmdRef.current?.render();
            } catch (err) {
              console.warn("Error during resize render:", err);
            }
          }, 100);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
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
            minHeight: loading ? "400px" : "auto",
            position: "relative",
          }}
        />
      </div>
    );
  }
);
