const xml2js = require('xml2js');
const fs = require('fs');

class MusicXMLParser {
  constructor() {
    this.parser = new xml2js.Parser();
    this.builder = new xml2js.Builder();
  }

  async parseFile(filePath) {
    try {
      const xmlData = fs.readFileSync(filePath, 'utf8');
      const result = await this.parser.parseStringPromise(xmlData);
      return result;
    } catch (error) {
      throw new Error(`Failed to parse MusicXML file: ${error.message}`);
    }
  }

  buildXML(musicXMLObject) {
    return this.builder.buildObject(musicXMLObject);
  }

  saveFile(filePath, xmlContent) {
    fs.writeFileSync(filePath, xmlContent);
  }
}

module.exports = MusicXMLParser;