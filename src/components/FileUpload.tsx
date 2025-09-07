import React, { useCallback } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File, content: string) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xml') && !file.name.toLowerCase().endsWith('.musicxml')) {
      alert('Please select a MusicXML file (.xml or .musicxml)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileUpload(file, content);
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.xml') || file.name.toLowerCase().endsWith('.musicxml')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            onFileUpload(file, content);
          }
        };
        reader.readAsText(file);
      } else {
        alert('Please select a MusicXML file (.xml or .musicxml)');
      }
    }
  }, [onFileUpload, disabled]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          disabled 
            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept=".xml,.musicxml"
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-input"
        />
        <label htmlFor="file-input" className={`block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="text-4xl">📄</div>
            <div className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              MusicXML files (.xml, .musicxml)
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};