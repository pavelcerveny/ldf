const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const negotiate = require('negotiate');

let instance; // singleton hack

class ViewGeneratorCollection {
  constructor () {
    if (!instance) {
      instance = this;
    }

    this.viewGenerators = {};
    this.viewGeneratorsContentType = {};

    return instance;
  }

  // getGenerator (pattern, type = 'html') {
  //   const ucFirstPattern = pattern.charAt(0).toUpperCase() + pattern.slice(1);
  //   const typeToUpper = type.toUpperCase();
  //   const name = `${ucFirstPattern}${typeToUpper}ViewGenerator`;
  //   for (const [key, inst] of Object.entries(this.viewGenerators)) {
  //     if (key === name) {
  //       return inst;
  //     }
  //   }
  // }

  getGenerator (matchedGen) {
    if (matchedGen.generator.length) {
      return this.viewGenerators[matchedGen.generator];
    } else {
      // TODO: return error
    }
  }

  matchGenerator (name, request) {
    // Retrieve all possible content types for specific template generator name
    const generatorList = this.viewGeneratorsContentType[name];

    if (!generatorList || !generatorList.length) {
      // TODO: return error
    }
    // Negotiate the view best matching the request's requirements
    const generatorDetails = negotiate.choose(generatorList, request)[0];
    if (!generatorDetails) {
      // TODO: return error
    }

    return generatorDetails;
  };

  instantiateAll () {
    const files = this.findGeneratorFiles('./templates', /\.js$/);

    files.forEach((filename) => {
      const Constructor = require(filename);
      const object = new Constructor();
      this.viewGenerators[object.constructor.name] = object;
      if (!this.viewGeneratorsContentType[object.getName()]) {
        this.viewGeneratorsContentType[object.getName()] = [];
      }
      this.viewGeneratorsContentType[object.getName()] = this.viewGeneratorsContentType[object.getName()].concat(object.getContentTypes());
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
