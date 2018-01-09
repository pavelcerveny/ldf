const RDFViewGenerator = require('../../RDFViewGenerator');
let instance = null;

const dcTerms = 'http://purl.org/dc/terms/';
const rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const xsd = 'http://www.w3.org/2001/XMLSchema#';
const hydra = 'http://www.w3.org/ns/hydra/core#';
const voID = 'http://rdfs.org/ns/void#';

class TriplePatternRDFViewGenerator extends RDFViewGenerator {
  constructor () {
    super('triplePattern');
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  render (settings, request, response, done) {
    const newSettings = this.getWriter(settings, request, response, done);
    const writer = newSettings.writer;
    this.renderRDF(newSettings, writer.data, writer.meta, writer.end);
  }

  renderRDF (settings, data, metadata, done) {
    const datasource = settings.datasource;
    const fragment = settings.fragment;
    const query = settings.query;
    const results = settings.result;
    let metadataDone = false;

    // Add data source metadata
    metadata(datasource.index, hydra + 'member', datasource.url);

    metadata(datasource.url, rdf + 'type', voID + 'Dataset');
    metadata(datasource.url, rdf + 'type', hydra + 'Collection');
    metadata(datasource.url, voID + 'subset', fragment.pageUrl);
    if (fragment.url !== fragment.pageUrl) {
      metadata(datasource.url, voID + 'subset', fragment.url);
    }

    // Add data source controls
    metadata(datasource.url, hydra + 'search', '_:triplePattern');
    metadata('_:triplePattern', hydra + 'template', '"' + datasource.templateUrl + '"');
    metadata('_:triplePattern', hydra + 'variableRepresentation', hydra + 'ExplicitRepresentation');
    metadata('_:triplePattern', hydra + 'mapping', '_:subject');
    metadata('_:triplePattern', hydra + 'mapping', '_:predicate');
    metadata('_:triplePattern', hydra + 'mapping', '_:object');
    metadata('_:subject',   hydra + 'variable',      '"subject"');
    metadata('_:subject',   hydra + 'property', rdf + 'subject');
    metadata('_:predicate', hydra + 'variable',      '"predicate"');
    metadata('_:predicate', hydra + 'property', rdf + 'predicate');
    metadata('_:object',    hydra + 'variable',      '"object"');
    metadata('_:object',    hydra + 'property', rdf + 'object');

    // Add fragment metadata
    results.getProperty('metadata', function (meta) {

      // General fragment metadata
      metadata(fragment.url, voID + 'subset', fragment.pageUrl);
      metadata(fragment.pageUrl, rdf + 'type', hydra + 'PartialCollectionView');
      metadata(fragment.pageUrl, dcTerms + 'title',
        '"Linked Data Fragment of ' + (datasource.title || '') + '"@en');
      metadata(fragment.pageUrl, dcTerms + 'description',
        '"Triple Pattern Fragment of the \'' + (datasource.title || '') + '\' dataset ' +
        'containing triples matching the pattern ' + query.patternString + '."@en');
      metadata(fragment.pageUrl, dcTerms + 'source',   datasource.url);

      // Total pattern matches count
      const totalCount = meta.totalCount;
      metadata(fragment.pageUrl, hydra + 'totalItems', '"' + totalCount + '"^^' + xsd + 'integer');
      metadata(fragment.pageUrl, voID  + 'triples',    '"' + totalCount + '"^^' + xsd + 'integer');

      // Page metadata
      metadata(fragment.pageUrl, hydra + 'itemsPerPage', '"' + query.limit + '"^^' + xsd + 'integer');
      metadata(fragment.pageUrl, hydra + 'first', fragment.firstPageUrl);
      if (query.offset) {
        metadata(fragment.pageUrl, hydra + 'previous', fragment.previousPageUrl);
      }
      if (totalCount >= query.limit + (query.offset || 0)) {
        metadata(fragment.pageUrl, hydra + 'next', fragment.nextPageUrl);
      }

      // End if the data was also written
      metadataDone = true;
      results.ended && done();
    });

    // Add fragment data
    results.on('data', data);
    results.on('end', function () { metadataDone && done(); });
  };
}

module.exports = TriplePatternRDFViewGenerator;
