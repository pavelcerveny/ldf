
class ViewGenerator {
  constructor (name, contentTypes) {
    this.contentTypesString = contentTypes;
    this.name = name;
    this.contentTypes = this.parseContentTypes(this.contentTypesString);
  }

  getContentTypes () {
    return this.contentTypes;
  }

  getName () {
    return this.name;
  }

  render () {
    console.log('abstract method');
  }

  parseContentTypes (contentTypes) {
    let matcher = Object.create(null);
    if (typeof contentTypes === 'string') {
      contentTypes = contentTypes.split(',').map((typeString) => {
        let contentType = typeString.match(/[^;,]*/)[0];
        const responseType = contentType + ';charset=utf-8';
        const quality = typeString.match(/;q=([0-9.]+)/);

        matcher[contentType] = matcher[responseType] = true;
        return {
          generator: this.constructor.name, // FIXME
          type: contentType,
          responseType: responseType,
          quality: quality ? Math.min(Math.max(parseFloat(quality[1]), 0.0), 1.0) : 1.0
        };
      });
    }
    return contentTypes || [];
  };
}

module.exports = ViewGenerator;
