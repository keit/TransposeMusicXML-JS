import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { TranspositionControls } from './components/TranspositionControls';
import { MusicDisplay } from './components/MusicDisplay';
import { MusicTransposer } from './lib/MusicTransposer';
import { SAXMusicXMLParser } from './lib/SAXMusicXMLParser';
import './App.css';

interface UploadedFile {
  file: File;
  content: string;
}

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [transposedXML, setTransposedXML] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transpositionInfo, setTranspositionInfo] = useState<string>('');

  const handleFileUpload = useCallback((file: File, content: string) => {
    setUploadedFile({ file, content });
    setTransposedXML(null);
    setError(null);
    setTranspositionInfo('');
  }, []);

  const handleTranspose = useCallback(async (interval: string | null, keyOrder: 'chromatic' | 'fourths' = 'chromatic') => {
    if (!uploadedFile) {
      setError('Please upload a MusicXML file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transposer = new MusicTransposer();
      const parser = new SAXMusicXMLParser();
      parser.setTransposer(transposer);

      let result: string;
      let info: string;

      if (interval === null) {
        // All 12 keys
        result = await parser.transposeToAllKeys(uploadedFile.content, keyOrder);
        const orderType = keyOrder === 'fourths' ? 'circle of fourths' : 'chromatic';
        info = `Transposed to all 12 keys (${orderType} order)`;
      } else {
        // Single interval
        result = await parser.transposeString(uploadedFile.content, interval);
        const semitones = transposer.parseInterval(interval);
        const sign = semitones >= 0 ? '+' : '';
        info = `Transposed by ${sign}${semitones} semitones`;
      }

      setTransposedXML(result);
      setTranspositionInfo(info);
    } catch (err) {
      console.error('Transposition error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transpose music');
    } finally {
      setLoading(false);
    }
  }, [uploadedFile]);

  const downloadTransposed = useCallback(() => {
    if (!transposedXML || !uploadedFile) return;

    const blob = new Blob([transposedXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const originalName = uploadedFile.file.name.replace(/\.(xml|musicxml)$/i, '');
    const suffix = transpositionInfo.includes('all 12 keys') ? '_all_keys' : '_transposed';
    link.download = `${originalName}${suffix}.xml`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transposedXML, uploadedFile, transpositionInfo]);

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
            <FileUpload 
              onFileUpload={handleFileUpload}
              disabled={loading}
            />
            {uploadedFile && (
              <div className="file-info">
                <p>✅ <strong>{uploadedFile.file.name}</strong> ({(uploadedFile.file.size / 1024).toFixed(1)} KB)</p>
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
          
          {transposedXML && (
            <div className="result-header">
              <div className="result-info">
                <p><strong>{transpositionInfo}</strong></p>
                <button 
                  onClick={downloadTransposed}
                  className="download-button"
                >
                  📥 Download Transposed XML
                </button>
              </div>
            </div>
          )}

          <div className="display-sections">
            {uploadedFile && (
              <div className="display-section">
                <h4>Original</h4>
                <MusicDisplay 
                  musicXML={uploadedFile.content}
                  title={uploadedFile.file.name}
                />
              </div>
            )}

            {transposedXML && (
              <div className="display-section">
                <h4>Transposed ({transpositionInfo})</h4>
                <MusicDisplay 
                  musicXML={transposedXML}
                  title={`${uploadedFile?.file.name} - ${transpositionInfo}`}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React, TypeScript, OpenSheetMusicDisplay, and SAX parser</p>
      </footer>
    </div>
  );
};

export default App;
