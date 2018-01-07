require('marko/node-require').install();
const indexDatasource = require('../../../views/tripplePattern/indexDatasource.marko');
const datasource = require('../../../views/tripplePattern/datasource.marko');
const layout = require('../../../views/layout.marko');

let instance = null;

class TriplePatternHTMLViewGenerator {
  constructor () {
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
   * @param done
   */
  render (settings, request, response, done) {
    // Read the data and metadata
    settings.triples = [];

    // BufferIterator
    let results = settings.results;

    results.on('data', function (triple) {
      settings.triples.push(triple);
    });
    results.on('end', function () {
      settings.metadata && this.renderHTML(settings, request, response);
    });
    results.getProperty('metadata', function (metadata) {
      settings.metadata = metadata;
      results.ended && this.renderHTML(settings, request, response);
    });
  }

  renderHTML (settings, request, response) {
    let basics = {
      assetsPath: 'assets',
      baseURL: '/',
      header: '',
      component: null
    };

    if (this.settings.datasource.role === 'index') {
      basics.component = indexDatasource;
    } else {
      basics.component = datasource;
    }

    layout.render({
      ...basics,
      ...settings
    }, response);
  }
}

module.exports = TriplePatternHTMLViewGenerator;
