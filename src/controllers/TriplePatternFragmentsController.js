const Controller = require('./Controller');
const url = require('url');
const N3Util = require('n3').Util;
const _ = require('lodash');

let instance; // singleton hack

class TriplePatternFragmentsController extends Controller {
  constructor (config, logger, viewsGeneratorCollection) {
    super(config, logger);

    if (!instance) {
      instance = this;
    }
    this.viewsGeneratorCollection = viewsGeneratorCollection;
    return instance;
  }

  handle (request, response, next) {
    const extractedFeatures = this.extractFeatures(request);
    const datasource = this.extractDatasource(request);
    const triplePattern = this.extractQuery(request);

    if (triplePattern.subject || triplePattern.predicate || triplePattern.object) {
      extractedFeatures.features = {
        ...extractedFeatures.features,
        triplePattern: true
      };
    }

    const datasourceSettings = this.datasources[datasource];

    if (!datasourceSettings) {
      next(); // TODO: error, not found, other
    }

    /*
     * eg.: { features: { limit: true },
     *         limit: 100,
     *         offset: null,
     *         subject: null,
     *         predicate: null,
     *         object: null }
     */
    const query = {
      ...extractedFeatures,
      ...triplePattern
    };


    if (!datasourceSettings.datasource.supportsQuery(query)) {
      // TODO: error controller
    }

    const result = datasourceSettings.datasource.select(query, (error) => {
      // TODO: error controller
      console.log(error);
    });

    const metadata = this.createFragmentMetadata(request, query, datasourceSettings);

    const matchedGenerator = this.viewsGeneratorCollection.matchGenerator('triplePattern', request);
    const generator = this.viewsGeneratorCollection.getGenerator(matchedGenerator);

    const settings = {
      result,
      metadata,
      fragment: metadata.fragment,
      datasource: datasourceSettings,
      query
    };
    // console.log(settings);

    generator.render(settings, request, response);

    return response;
  }

  extractQuery (request) {
    const iriMatcher = /^(<?)([^_?$"<>][^"<>]*)>?$/;
    const literalMatcher = /^("[^]*")(?:|\^\^<?([^"<>]+)>?|@[a-z0-9-]+)$/i;

    const query = request.parsedUrl.query;
    let triplePatternData = {
      subject: null,
      predicate: null,
      object: null
    };

    if (query) {
      if (query.subject) {
        let match = iriMatcher.exec(query.subject);
        triplePatternData.subject = match[1] ? match[2] : this.expandIRI(match[2]);
      }

      if (query.predicate) {
        let match = iriMatcher.exec(query.predicate);
        triplePatternData.predicate = match[1] ? match[2] : this.expandIRI(match[2]);
      }

      if (query.object) {
        // The object can be an IRI…
        let iriMatch = iriMatcher.exec(query.object);
        const literalMatch = literalMatcher.exec(query.object);

        if (iriMatch) {
          triplePatternData.object = iriMatch[1] ? iriMatch[2] : this.expandIRI(iriMatch[2]);
        } else if (literalMatch) {
          // or the object can be a literal (with a type or language)
          triplePatternData.object = literalMatch[2] ? literalMatch[1] + '^^' + this.expandIRI(literalMatch[2]) : literalMatch[0];
        }
      }
    }

    return triplePatternData;
  }

  expandIRI (name) {
    const prefixedNameMatcher = /^([a-z0-9-]*):([^/#:]*)$/i;
    const match = prefixedNameMatcher.exec(name);
    let prefix = null;

    return match && (prefix = this.prefixes[match[1]]) ? prefix + match[2] : name;
  }

  extractDatasource (request) {
    let datasource = /^\/?(.*)$/.exec(request.parsedUrl.pathname || '');
    datasource = datasource[1];
    return datasource;
  }

  /**
   * Extract limit and offset, if possible from url query
   */
  extractFeatures (request) {
    let limit = 100;
    let page = null;
    let offset = null;
    let features = {
      limit: true
    };

    if (this.config.limit && Number.isInteger(this.config.limit)) {
      limit = this.config.limit;
    }

    if (request.parsedUrl.query && request.parsedUrl.query.page) {
      page = request.parsedUrl.query.page;
      features = {
        ...features,
        offset: true
      };
    }

    if (page && /^\d+$/.test(page) && (page = parseInt(page, 10)) > 1) {
      offset = limit * (page - 1)
    }

    return {
      features,
      limit,
      offset
    };
  }

  createFragmentMetadata (request, query, datasourceSettings) {
    const requestUrl = request.requestUrl;

    // Generate a textual representation of the pattern
    query.patternString = '{ ' +
      (query.subject ? '<' + query.subject + '> ' : '?s ') +
      (query.predicate ? '<' + query.predicate + '> ' : '?p ') +
      (N3Util.isIRI(query.object) ? '<' + query.object + '> ' : (query.object || '?o')) + ' }';

    return {
      datasource: _.assign(_.omit(datasourceSettings, 'datasource'), {
        index: requestUrl.indexUrl + '#dataset',
        url: requestUrl.datasourceUrl + '#dataset',
        templateUrl: requestUrl.datasourceUrl + '{?subject,predicate,object}',
      }),
      fragment: {
        url: requestUrl.fragmentUrl,
        pageUrl: requestUrl.pageUrl,
        firstPageUrl: requestUrl.fragmentPageUrlBase + '1',
        nextPageUrl: requestUrl.fragmentPageUrlBase + (requestUrl.currentPage + 1),
        previousPageUrl: requestUrl.currentPage > 1 ? requestUrl.fragmentPageUrlBase + (requestUrl.currentPage - 1) : null
      },
      query: query,
      prefixes: this.prefixes,
      datasources: this.datasources
    };
  }

  renderHTML () {

  }

  renderRDF () {

  }
}

module.exports = TriplePatternFragmentsController;
