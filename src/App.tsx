import React, { useState, useCallback } from "react";
import { FileUpload } from "./components/FileUpload";
import { TranspositionControls } from "./components/TranspositionControls";
import { MusicDisplay } from "./components/MusicDisplay";
import { MusicTransposer } from "./lib/MusicTransposer";
import { SAXMusicXMLParser } from "./lib/SAXMusicXMLParser";
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎼 MusicXML Transposer</h1>
        <p>Upload, transpose, and view MusicXML files in your browser</p>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <div className="upload-section">
            <h2>1. Upload MusicXML File</h2>
            <FileUpload onFileUpload={handleFileUpload} disabled={loading} />
            {uploadedFile && (
              <div className="file-info">
                <p>
                  ✅ <strong>{uploadedFile.file.name}</strong> (
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
          </div>

          <div className="transpose-section">
            <h2>2. Choose Transposition</h2>
            <TranspositionControls
              onTranspose={handleTranspose}
              disabled={!uploadedFile || loading}
              loading={loading}
            />
          </div>
        </div>

        {error && (
          <div className="error-section">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        <div className="result-section">
          <h2>3. Result</h2>

          {(transposedXML || transposedKeys.length > 0) && (
            <div className="result-header">
              <div className="result-info">
                <p>
                  <strong>{transpositionInfo}</strong>
                </p>
                {transposedXML && (
                  <button
                    onClick={downloadTransposed}
                    className="download-button"
                  >
                    📥 Download Transposed XML
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="display-sections">
            {uploadedFile && (
              <div className="display-section">
                <MusicDisplay
                  musicXML={uploadedFile.content}
                  title={"Original"}
                />
              </div>
            )}

            {/* Single Key Transposition Display */}
            {transposedXML && (
              <div className="display-section">
                <MusicDisplay
                  musicXML={transposedXML}
                  title={`${transpositionInfo}`}
                />
              </div>
            )}

            {/* All 12 Keys Display */}
            {transposedKeys.length > 0 &&
              transposedKeys.map((keyInfo, index) => (
                <div key={index} className="display-section">
                  <MusicDisplay
                    musicXML={keyInfo.xml}
                    title={`In the key of ${keyInfo.key}`}
                  />
                </div>
              ))}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built with React, TypeScript, OpenSheetMusicDisplay, and SAX parser
        </p>
      </footer>
    </div>
  );
};

export default App;
