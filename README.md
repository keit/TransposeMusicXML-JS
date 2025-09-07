# MusicXML Transpose WebApp

A modern React web application designed for **Jazz learners** and musicians who want to master musical ideas across all keys. This tool specializes in transposing MusicXML files to different keys, with a focus on the widely-recommended **12-key practice method** essential for Jazz improvisation mastery.

Perfect for transposing **short licks, patterns, chord progressions, and musical phrases** into all 12 keys - the gold standard practice technique recommended by Jazz educators worldwide.

## Features

### 🎷 **Jazz Learning & Practice Tools**
- **12-Key Practice Method**: Generate all 12 transpositions in one score - essential for Jazz mastery
- **Circle of Fourths Option**: Practice keys in the theoretical order (C-F-B♭-E♭-A♭-D♭-G♭-B-E-A-D-G)
- **Chromatic Order Option**: Systematic semitone progression for methodical practice
- **Single Interval Transposition**: Quick transpose to any specific key (-11 to +11 semitones)
- **Jazz-Friendly**: Perfect for licks, patterns, ii-V-I progressions, and chord voicings

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

## Jazz Learning Guide

### The 12-Key Practice Method

**Why Practice in All 12 Keys?**
- **Muscle Memory**: Build finger patterns across the entire instrument
- **Theory Mastery**: Understand relationships between keys and chord progressions
- **Improvisation Freedom**: Play any lick/pattern in any key during performance
- **Auditory Training**: Develop relative pitch and harmonic awareness

**Perfect for:**
- **Jazz Licks**: Bebop lines, chromatic runs, scale patterns
- **Chord Progressions**: ii-V-I, turnarounds, substitutions
- **Voicings**: Rootless voicings, shell chords, upper structures
- **Rhythmic Patterns**: Comping patterns, syncopated phrases

### Usage Guide

1. **Upload Your Musical Idea**:
   - Create a short MusicXML file with your lick/pattern (use MuseScore, Finale, etc.)
   - Drag & drop the `.xml` or `.musicxml` file onto the upload area

2. **Choose Your Practice Method**:
   - **All 12 Keys** (Recommended): Generates complete practice score
     - **Circle of Fourths**: C→F→B♭→E♭→A♭→D♭→G♭→B→E→A→D→G (Jazz theoretical order)
     - **Chromatic**: C→C#→D→D#→E→F→F#→G→G#→A→A#→B (Systematic progression)
   - **Single Key**: Quick transpose to one specific key

3. **Generate & Practice**:
   - Click "Transpose" to create your practice score
   - View the complete 12-key score in your browser
   - **Export to PDF** for printing and offline practice

4. **Download for Practice**:
   - PDF: Print for music stand practice
   - MusicXML: Import into your favorite notation software

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
- Optimized for short musical phrases (typical Jazz licks: 1-8 measures)

## Jazz Practice Benefits

### Why This Tool is Perfect for Jazz Students

**Traditional Method Problems:**
- ❌ Manual transposition is time-consuming and error-prone
- ❌ Writing out all 12 keys by hand takes hours
- ❌ Commercial software often overkill for simple licks
- ❌ Most tools don't support circle of fourths ordering

**Our Solution:**
- ✅ **Instant Results**: Upload once, get all 12 keys in seconds
- ✅ **Error-Free**: Computer-perfect transposition with proper key signatures
- ✅ **Print-Ready**: Professional PDF output for music stand practice
- ✅ **Theory-Based**: Circle of fourths matches Jazz harmonic thinking
- ✅ **Free & Accessible**: No software purchases, works in any browser

### Recommended Workflow

1. **Transcribe or Compose** your lick in your favorite notation software
2. **Export as MusicXML** from MuseScore, Finale, Sibelius, etc.
3. **Upload & Transpose** using this tool
4. **Print PDF** for practice sessions
5. **Practice systematically** through all keys
6. **Build your repertoire** of transposed patterns

## License

This project is open source. See the LICENSE file for details.

## Acknowledgments

- **Jazz Educators Worldwide**: For establishing the 12-key practice method as the gold standard
- **OpenSheetMusicDisplay**: For excellent music notation rendering in browsers
- **Saxes**: For reliable XML streaming parsing that handles complex musical notation
- **Vite & TypeScript**: For modern development tools that enable fast, reliable software
- **Jazz Community**: For emphasizing the importance of practicing musical ideas in all keys

*"The goal is not to learn 12 different licks, but to learn one lick so well that you can play it in any key without thinking."* - Jazz pedagogy wisdom