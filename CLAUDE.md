# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm start` - Run the CLI tool (equivalent to `node cli.js`)
- `npm run bundle` - Bundle the CLI using esbuild to create a standalone `transpose.js` file

### Testing
- `node cli.js test.xml +5` - Test transposition with the included sample file
- No formal test framework configured - manual testing with sample XML files

### CLI Usage
```bash
# Single interval transposition
node cli.js <file> <interval> [-o output.xml]

# All 12 keys generation  
node cli.js <file> [-o output.xml]
```

## Architecture

This is a Node.js command-line tool for transposing MusicXML files. The codebase uses a modular architecture with three main components:

### Core Architecture
- **CLI Interface** (`cli.js`): Uses Commander.js for argument parsing, handles file I/O and orchestrates the transposition workflow
- **Music Logic** (`transposer.js`): Contains the `MusicTransposer` class with chromatic mapping, circle of fifths calculations, and musical transposition algorithms  
- **XML Processing** (`sax-musicxml-parser.js`): Uses SAX streaming parser to process MusicXML files efficiently, handles note elements, harmony/chord symbols, and key signatures

### Key Design Patterns
- **Streaming Processing**: Uses SAX parser instead of DOM to handle large orchestral scores efficiently
- **Separation of Concerns**: Musical logic is isolated from XML parsing and CLI interface
- **State Tracking**: Parser maintains element stack and context flags (insideNote, insideHarmony, etc.) during streaming

### Musical Transposition Logic
- **Chromatic System**: 12-tone equal temperament mapping (C=0 to B=11)
- **Enharmonic Handling**: Prefers sharps over flats for positive transpositions
- **Key Signature Transposition**: Uses circle of fifths progression for key changes
- **Chord Symbol Support**: Transposes both root notes and bass notes in harmony elements

### File Structure
- All core logic is in the root directory
- Test XML files are included for manual verification
- No formal testing framework - relies on manual testing with sample files
- Bundling support via esbuild for distribution

The parser processes MusicXML elements on-the-fly during streaming, modifying musical elements (notes, key signatures, chord symbols) according to the transposition interval before writing to output.