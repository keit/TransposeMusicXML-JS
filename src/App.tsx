import React, { useState, useCallback, useRef, useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import { TranspositionControls } from "./components/TranspositionControls";
import { MusicDisplay } from "./components/MusicDisplay";
import { PlaybackControls } from "./components/PlaybackControls";
import { MusicDisplayContainer } from "./components/MusicDisplayContainer";
import { MusicTransposer } from "./lib/MusicTransposer";
import { SAXMusicXMLParser } from "./lib/SAXMusicXMLParser";
import { MusicPlaybackService } from "./services/MusicPlaybackService";
import "./App.css";

interface UploadedFile {
  file: File;
  content: string;
}

interface TransposedKeyInfo {
  key: string;
  semitones: number;
  xml: string;
}

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [transposedXML, setTransposedXML] = useState<string | null>(null);
  const [transposedKeys, setTransposedKeys] = useState<TransposedKeyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transpositionInfo, setTranspositionInfo] = useState<string>("");

  // Playback settings state
  const [playbackBpm, setPlaybackBpm] = useState(120);
  const [playbackInstrument, setPlaybackInstrument] = useState<
    "concert" | "bb" | "eb"
  >("concert");
  const [playbackSwing, setPlaybackSwing] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  // Playback service
  const playbackServiceRef = useRef<MusicPlaybackService | null>(null);

  // Initialize playback service
  useEffect(() => {
    playbackServiceRef.current = new MusicPlaybackService();

    return () => {
      // Cleanup on unmount
      if (playbackServiceRef.current) {
        playbackServiceRef.current.stop();
      }
    };
  }, []);

  const handleFileUpload = useCallback((file: File, content: string) => {
    setUploadedFile({ file, content });
    setTransposedXML(null);
    setTransposedKeys([]);
    setError(null);
    setTranspositionInfo("");
  }, []);

  const handleTranspose = useCallback(
    async (
      interval: string | null,
      keyOrder: "chromatic" | "fourths" = "chromatic"
    ) => {
      if (!uploadedFile) {
        setError("Please upload a MusicXML file first");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const transposer = new MusicTransposer();
        const parser = new SAXMusicXMLParser();
        parser.setTransposer(transposer);

        if (interval === null) {
          // All 12 keys
          const separateKeys = await parser.transposeToAllKeys(
            uploadedFile.content,
            keyOrder
          );
          setTransposedKeys(separateKeys);
          setTransposedXML(null);
          const orderType =
            keyOrder === "fourths" ? "circle of fourths" : "chromatic";
          setTranspositionInfo(
            `Transposed to all 12 keys (${orderType} order)`
          );
        } else {
          // Single interval
          const result = await parser.transposeByInterval(
            uploadedFile.content,
            interval
          );
          const semitones = transposer.parseInterval(interval);
          const sign = semitones >= 0 ? "+" : "";
          setTransposedXML(result);
          setTransposedKeys([]);
          setTranspositionInfo(`Transposed by ${sign}${semitones} semitones`);
        }
      } catch (err) {
        console.error("Transposition error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to transpose music"
        );
      } finally {
        setLoading(false);
      }
    },
    [uploadedFile]
  );

  const downloadTransposed = useCallback(() => {
    if (!uploadedFile) return;

    const originalName = uploadedFile.file.name.replace(
      /\.(xml|musicxml)$/i,
      ""
    );

    if (transposedXML) {
      // Download single transposition
      const blob = new Blob([transposedXML], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const suffix = "_transposed";
      link.download = `${originalName}${suffix}.xml`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [transposedXML, uploadedFile]);

  // Playback handlers
  const handlePlayKey = useCallback(
    async (keyInfo: TransposedKeyInfo) => {
      if (!playbackServiceRef.current) return;

      if (playingKey === keyInfo.key) {
        // Stop playing
        playbackServiceRef.current.stop();
        setPlayingKey(null);
      } else {
        try {
          // Stop any current playback
          if (playingKey) {
            playbackServiceRef.current.stop();
          }

          // Start playing this key
          setPlayingKey(keyInfo.key);

          // Parse and prepare the music
          await playbackServiceRef.current.parseAndPrepare(keyInfo.xml);

          // Play with current settings
          await playbackServiceRef.current.play({
            bpm: playbackBpm,
            transposingInstrument: playbackInstrument,
            swing: playbackSwing,
          });

          // Monitor playback state
          const checkPlayback = () => {
            if (
              playbackServiceRef.current &&
              !playbackServiceRef.current.getIsPlaying()
            ) {
              setPlayingKey(null);
            } else {
              setTimeout(checkPlayback, 500);
            }
          };
          checkPlayback();
        } catch (error) {
          console.error("Playback error:", error);
          setError(
            `Playback failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setPlayingKey(null);
        }
      }
    },
    [playingKey, playbackBpm, playbackInstrument, playbackSwing]
  );

  const handlePlaySingle = useCallback(async () => {
    if (!playbackServiceRef.current || !transposedXML) return;

    if (playingKey === "single") {
      playbackServiceRef.current.stop();
      setPlayingKey(null);
    } else {
      try {
        // Stop any current playback
        if (playingKey) {
          playbackServiceRef.current.stop();
        }

        setPlayingKey("single");

        // Parse and prepare the music
        await playbackServiceRef.current.parseAndPrepare(transposedXML);

        // Play with current settings
        await playbackServiceRef.current.play({
          bpm: playbackBpm,
          transposingInstrument: playbackInstrument,
          swing: playbackSwing,
        });

        // Monitor playback state
        const checkPlayback = () => {
          if (
            playbackServiceRef.current &&
            !playbackServiceRef.current.getIsPlaying()
          ) {
            setPlayingKey(null);
          } else {
            setTimeout(checkPlayback, 500);
          }
        };
        checkPlayback();
      } catch (error) {
        console.error("Playback error:", error);
        setError(
          `Playback failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setPlayingKey(null);
      }
    }
  }, [
    playingKey,
    playbackBpm,
    playbackInstrument,
    playbackSwing,
    transposedXML,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 text-center shadow-lg">
        <h1 className="text-4xl font-bold mb-2">🎼 MusicXML Transposer</h1>
        <p className="text-lg opacity-90">
          Upload, transpose, and view MusicXML files in your browser
        </p>
      </header>

      <main className="flex-1 max-w-6xl mx-auto p-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              1. Upload MusicXML File
            </h2>
            <FileUpload onFileUpload={handleFileUpload} disabled={loading} />
            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  ✅ <strong>{uploadedFile.file.name}</strong> (
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              2. Choose Transposition
            </h2>
            <TranspositionControls
              onTranspose={handleTranspose}
              disabled={!uploadedFile || loading}
              loading={loading}
            />
          </div>
        </div>

        {/* Playback Controls */}
        {(transposedXML || transposedKeys.length > 0) && (
          <div className="mb-8">
            <PlaybackControls
              onBpmChange={setPlaybackBpm}
              onInstrumentChange={setPlaybackInstrument}
              onSwingChange={setPlaybackSwing}
            />
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              ❌ Error
            </h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            3. Result
          </h2>

          {(transposedXML || transposedKeys.length > 0) && (
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {transpositionInfo}
                </p>
                {transposedXML && (
                  <button
                    onClick={downloadTransposed}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    📥 Download Transposed XML
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {uploadedFile && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Original
                  </h3>
                </div>
                <MusicDisplay musicXML={uploadedFile.content} />
              </div>
            )}

            {/* Single Key Transposition Display */}
            {transposedXML && (
              <MusicDisplayContainer
                musicXML={transposedXML}
                title={transpositionInfo}
                onPlay={handlePlaySingle}
                isPlaying={playingKey === "single"}
              />
            )}

            {/* All 12 Keys Display */}
            {transposedKeys.length > 0 &&
              transposedKeys.map((keyInfo, index) => (
                <MusicDisplayContainer
                  key={index}
                  musicXML={keyInfo.xml}
                  title={`In the key of ${keyInfo.key}`}
                  onPlay={() => handlePlayKey(keyInfo)}
                  isPlaying={playingKey === keyInfo.key}
                />
              ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-300 text-center p-4 text-sm">
        <p>
          Built with React, TypeScript, OpenSheetMusicDisplay, and SAX parser
        </p>
      </footer>
    </div>
  );
};

export default App;
