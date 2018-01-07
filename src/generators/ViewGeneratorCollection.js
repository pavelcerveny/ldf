const path = require('path');
const fs = require('fs');
const _ = require('lodash');

let instance; // singleton hack

class ViewGeneratorCollection {
  constructor () {
    if (!instance) {
      instance = this;
    }

    this.viewGenerators = [];
    return instance;
  }

  /**
   *
   * @param pattern eg. -> triplePattern
   * @param type
   */
  getGenerator (pattern, type = 'html') {
    const ucFirstPattern = pattern.charAt(0).toUpperCase() + pattern.slice(1);
    const typeToUpper = type.toUpperCase();
    const name = `${ucFirstPattern}${typeToUpper}ViewGenerator`;
    return this.viewGenerators[name];
  }

  instantiateAll () {
    const files = this.findGeneratorFiles('./templates', /\.js$/);

    files.forEach((filename) => {
      const Constructor = require(filename);
      this.viewGenerators.push(new Constructor());
    });
  }

  findGeneratorFiles (folder, pattern, includeCurrentFolder) {
    folder = path.resolve(__dirname, folder);
    return _.flatten(_.compact(fs.readdirSync(folder).map((name) => {
      name = path.join(folder, name);
      if (fs.statSync(name).isDirectory()) {
        return this.findGeneratorFiles(name, pattern, true);
      } else if (includeCurrentFolder && pattern.test(name)) {
        return name;
      }
    })));
  }
}

module.exports = ViewGeneratorCollection;
