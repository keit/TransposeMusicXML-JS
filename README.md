# MusicXML Transpose

A command-line tool for transposing MusicXML files by musical intervals. Supports both single interval transposition and generating all 12 chromatic keys.

## Features

- **Single interval transposition**: Transpose by any number of semitones (e.g., +5, -3, 7)
- **All keys generation**: Create a single file with the melody transposed to all 12 chromatic keys
- **Complete musical element support**: 
  - Notes (pitch, octave, accidentals)
  - Key signatures (circle of fifths)
  - Chord symbols and harmony elements
- **Preserves XML structure**: Maintains original formatting, declarations, and metadata
- **Memory efficient**: Uses SAX streaming parser for large files

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd TransposeMusicXML-JS
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Single Interval Transposition

Transpose a MusicXML file by a specific interval:

```bash
# Transpose up by 5 semitones (perfect fourth)
node cli.js input.xml +5

# Transpose down by 3 semitones (minor third)
node cli.js input.xml -3

# Transpose up by 7 semitones (perfect fifth)
node cli.js input.xml 7

# Specify custom output file
node cli.js input.xml +2 -o output.xml
```

### All Keys Generation

Generate all 12 chromatic transpositions in a single file:

```bash
# Generate all 12 keys
node cli.js input.xml

# Specify custom output file
node cli.js input.xml -o all-keys-output.xml
```

## Command Line Options

```bash
musicxml-transpose <file> [interval] [options]

Arguments:
  file         MusicXML file to transpose
  interval     Interval in semitones (e.g., +5, -3, 7)
               If omitted, transposes to all 12 keys

Options:
  -o, --output <file>  Output file (default: adds "_transposed" or "_all_keys" suffix)
  -h, --help          Display help information
  -V, --version       Display version number
```

## Examples

### Basic Usage
```bash
# Transpose "song.xml" up a major third (+4 semitones)
node cli.js song.xml +4

# Output: song_transposed.xml
```

### All Keys
```bash
# Generate all 12 keys of "melody.xml"
node cli.js melody.xml

# Output: melody_all_keys.xml (contains 12 transposed versions)
```

### Custom Output
```bash
# Transpose with custom output filename
node cli.js input.xml -2 --output "transposed-down-tone.xml"
```

## Supported Musical Elements

- **Notes**: Step, alter, octave transposition with proper enharmonic handling
- **Key Signatures**: Automatic circle of fifths calculation
- **Chord Symbols**: Root note and bass note transposition
- **Harmony Elements**: Complete chord transposition including alterations
- **Accidentals**: Automatic sharp/flat/natural conversion based on transposed pitches

## Technical Details

### Architecture

- **CLI Interface** (`cli.js`): Command-line argument parsing and file I/O
- **Transposition Logic** (`transposer.js`): Core musical transposition algorithms
- **XML Parser** (`sax-musicxml-parser.js`): SAX-based streaming XML processor

### Transposition Algorithm

1. **Chromatic Mapping**: Uses 12-tone equal temperament (0-11 semitone mapping)
2. **Circle of Fifths**: Key signature transposition via fifths progression
3. **Enharmonic Handling**: Prefers sharps over flats for positive transpositions
4. **Octave Wrapping**: Properly handles octave boundaries during transposition

### Memory Efficiency

- Uses SAX streaming parser instead of loading entire XML into memory
- Processes elements on-the-fly during parsing
- Suitable for large orchestral scores and complex arrangements

## File Format Support

- **Input**: MusicXML files (.xml, .musicxml)
- **Output**: Valid MusicXML preserving original structure and metadata
- **Compatibility**: Supports MusicXML 3.0+ format specifications

## Development

### Project Structure
```
├── cli.js                    # Command-line interface
├── transposer.js            # Musical transposition logic
├── sax-musicxml-parser.js   # XML parsing and processing
├── package.json             # Dependencies and metadata
└── README.md               # This file
```

### Dependencies
- `sax`: XML parsing library
- `commander`: Command-line interface framework

### Testing
```bash
# Run with sample file
node cli.js test.xml +5
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for musicians and music software developers
- Supports standard MusicXML format for broad compatibility
- Designed for educational and professional music transposition needs