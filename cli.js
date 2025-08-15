#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const SAXMusicXMLParser = require('./sax-musicxml-parser');
const MusicTransposer = require('./transposer');

const program = new Command();

program
  .name('musicxml-transpose')
  .description('Transpose MusicXML files by musical intervals')
  .version('1.0.0')
  .argument('<file>', 'MusicXML file to transpose')
  .argument('[interval]', 'Interval in semitones (e.g., +5, -3, 7). If not specified, transposes to all 12 keys')
  .option('-o, --output <file>', 'Output file (default: adds "_transposed" or "_all_keys" to input filename)')
  .action(async (file, interval, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`Error: File "${file}" not found.`);
        process.exit(1);
      }

      const parser = new SAXMusicXMLParser();
      const transposer = new MusicTransposer();
      parser.setTransposer(transposer);

      console.log(`Parsing MusicXML file: ${file}`);
      
      if (interval !== undefined) {
        // Single interval transposition
        console.log(`Transposing by ${interval} semitones...`);
        const outputFile = options.output || generateOutputFilename(file, interval);
        await parser.transposeFile(file, interval, outputFile);
        console.log(`Transposed MusicXML saved to: ${outputFile}`);
      } else {
        // All 12 keys transposition
        console.log(`Transposing to all 12 keys...`);
        const outputFile = options.output || generateOutputFilename(file);
        await parser.transposeToAllKeys(file, outputFile);
        console.log(`All 12 keys MusicXML saved to: ${outputFile}`);
      }

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

function generateOutputFilename(inputFile, interval = null) {
  const parsed = path.parse(inputFile);
  if (interval !== null) {
    return path.join(parsed.dir, `${parsed.name}_transposed${parsed.ext}`);
  } else {
    return path.join(parsed.dir, `${parsed.name}_all_keys${parsed.ext}`);
  }
}

program.parse();