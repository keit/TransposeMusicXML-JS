#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const MusicXMLParser = require('./musicxml-parser');
const MusicTransposer = require('./transposer');

const program = new Command();

program
  .name('musicxml-transpose')
  .description('Transpose MusicXML files by musical intervals')
  .version('1.0.0')
  .argument('<file>', 'MusicXML file to transpose')
  .argument('<interval>', 'Interval in semitones (e.g., +5, -3, 7)')
  .option('-o, --output <file>', 'Output file (default: adds "_transposed" to input filename)')
  .action(async (file, interval, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`Error: File "${file}" not found.`);
        process.exit(1);
      }

      const parser = new MusicXMLParser();
      const transposer = new MusicTransposer();

      console.log(`Parsing MusicXML file: ${file}`);
      const musicXML = await parser.parseFile(file);

      console.log(`Transposing by ${interval} semitones...`);
      const transposedXML = transposer.transposeMusicXML(musicXML, interval);

      const outputFile = options.output || generateOutputFilename(file);
      const xmlContent = parser.buildXML(transposedXML);
      
      parser.saveFile(outputFile, xmlContent);
      console.log(`Transposed MusicXML saved to: ${outputFile}`);

    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

function generateOutputFilename(inputFile) {
  const parsed = path.parse(inputFile);
  return path.join(parsed.dir, `${parsed.name}_transposed${parsed.ext}`);
}

program.parse();