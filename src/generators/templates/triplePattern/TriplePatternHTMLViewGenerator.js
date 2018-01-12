const N3Util = require('n3').Util;
const HTMLViewGenerator = require('../../HTMLViewGenerator');
const indexDatasource = require('../../../views/tripplePattern/indexDatasource.marko');
const datasource = require('../../../views/tripplePattern/datasource.marko');

let instance = null;

class TriplePatternHTMLViewGenerator extends HTMLViewGenerator {
  constructor () {
    super('triplePattern');

    if (!instance) {
      instance = this;
    }

    return instance;
  }

  /**
   *
   * @param settings
   * @param request
   * @param response
   */
  render (settings, request, response) {
    // Read the data and metadata
    settings.triples = [];

    // BufferIterator
    let results = settings.result;

    results.on('data', (triple) => {
      settings.triples.push(triple);
    });
    results.on('end', () => {
      settings.metadata && this.renderHTML(settings, request, response);
    });
    results.getProperty('metadata', (metadata) => {
      settings.metadata = metadata;
      results.ended && this.renderHTML(settings, request, response);
    });
  }

  /**
   *
   * @param settings
   * @param request
   * @param response
   */
  renderHTML (settings, request, response) {
    if (settings.datasource.role === 'index') {
      this.basics.component = indexDatasource;
    } else {
      this.basics.component = datasource;
    }

    const fragment = {
      datasource: settings.datasource,
      query: settings.query,
      metadata: settings.metadata,
      fragment: settings.fragment,
      triples: settings.triples,
      N3Util
    };

    this.renderLayout({
      ...this.basics,
      data: {
        ...settings,
        fragment
      }
    }, response);
  }
}

module.exports = TriplePatternHTMLViewGenerator;
