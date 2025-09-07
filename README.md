# MusicXML Transpose WebApp

A modern React web application for transposing MusicXML files to different keys. This tool allows musicians, composers, and arrangers to easily transpose musical scores to any chromatic interval or generate versions in all 12 keys simultaneously.

## Features

### 🎵 **MusicXML Transposition**
- **Single Interval Transposition**: Transpose to any chromatic interval (-11 to +11 semitones)
- **All 12 Keys Generation**: Create a single score with the melody transposed to all 12 chromatic keys
- **Smart Musical Logic**: Properly handles key signatures, chord symbols, and accidentals

### 🎼 **Music Display**
- **Interactive Score Rendering**: View transposed music using OpenSheetMusicDisplay (OSMD)
- **Before/After Comparison**: See original and transposed versions side by side
- **Responsive Layout**: Works on desktop and mobile devices

### 🔧 **Technical Features**
- **Streaming XML Processing**: Efficiently handles large orchestral scores using SAX parsing
- **Browser-Compatible**: Runs entirely in the browser - no server required
- **TypeScript**: Full type safety and modern development experience
- **Real-time Processing**: Fast transposition with immediate visual feedback

## How It Works

### Musical Transposition Logic
- **Chromatic System**: Uses 12-tone equal temperament mapping (C=0 to B=11)
- **Enharmonic Handling**: Prefers sharps over flats for positive transpositions
- **Key Signature Transposition**: Uses circle of fifths progression for key changes
- **Chord Symbol Support**: Transposes both root notes and bass notes in harmony elements

### File Processing
1. **Upload**: Drag & drop or select MusicXML files (.xml, .musicxml)
2. **Parse**: SAX streaming parser processes XML elements on-the-fly
3. **Transpose**: Musical elements (notes, keys, chords) are modified according to the interval
4. **Display**: Rendered using OSMD for interactive music visualization
5. **Download**: Export transposed MusicXML files

## Setup and Installation

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TransposeMusicXML-JS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:5173`
   - The application will automatically reload when you make changes

## Usage Guide

### Basic Transposition

1. **Upload MusicXML File**:
   - Drag and drop a `.xml` or `.musicxml` file onto the upload area
   - Or click to browse and select a file

2. **Choose Transposition Mode**:
   - **All 12 Keys** (Default): Creates a score with all 12 chromatic transpositions
   - **Single Interval**: Transposes to a specific interval

3. **Select Interval** (Single Interval mode only):
   - Choose from -11 to +11 semitones
   - Examples: +7 (Perfect 5th up), -5 (Perfect 4th down)

4. **Transpose**:
   - Click the "Transpose" button
   - View the results in the music display area

5. **Download**:
   - Click "Download Transposed MusicXML" to save the result

### Supported Intervals

| Semitones | Interval Name | Example (from C) |
|-----------|---------------|------------------|
| +11 | Major 7th up | B |
| +7 | Perfect 5th up | G |
| +5 | Perfect 4th up | F |
| +4 | Major 3rd up | E |
| +2 | Major 2nd up | D |
| 0 | No change | C |
| -2 | Major 2nd down | B♭ |
| -5 | Perfect 4th down | G |
| -7 | Perfect 5th down | F |

## Development

### Project Structure
```
src/
├── components/           # React components
│   ├── FileUpload.tsx   # File upload interface
│   ├── TranspositionControls.tsx  # Transposition options
│   └── MusicDisplay.tsx # Music rendering component
├── lib/                 # Core logic
│   ├── MusicTransposer.ts       # Transposition algorithms
│   └── SAXMusicXMLParser.ts     # XML parsing and processing
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
├── index.css          # Global styles
└── App.css           # Component styles
```

### Key Technologies
- **React 19**: UI framework with modern hooks
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast build tool and development server
- **Saxes**: SAX XML parser for streaming processing
- **OpenSheetMusicDisplay**: Music notation rendering
- **ESLint**: Code linting and style enforcement

### Available Scripts

- **`npm run dev`**: Start development server with hot reload
- **`npm run build`**: Build for production
- **`npm run preview`**: Preview production build locally
- **`npm run lint`**: Run ESLint to check code quality

### Architecture Principles

- **Streaming Processing**: Uses SAX parser instead of DOM to handle large files efficiently
- **Separation of Concerns**: Musical logic isolated from XML parsing and UI
- **State Tracking**: Parser maintains element stack and context during streaming
- **Type Safety**: Full TypeScript coverage with strict type checking

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Android Chrome
- **Requirements**: ES2020 support, Web File API

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Technical Notes

### MusicXML Support
- Supports standard MusicXML 3.1+ format
- Handles both compressed (.mxl) and uncompressed (.xml) files
- Processes notes, key signatures, time signatures, and chord symbols
- Maintains musical structure and formatting

### Performance
- Streaming SAX parser handles large orchestral scores (100+ parts)
- Memory-efficient processing without loading entire XML into memory
- Real-time transposition with minimal latency

## License

This project is open source. See the LICENSE file for details.

## Acknowledgments

- **OpenSheetMusicDisplay**: For excellent music notation rendering
- **Saxes**: For reliable XML streaming parsing
- **Vite**: For fast development experience
- **TypeScript**: For type safety and developer productivity