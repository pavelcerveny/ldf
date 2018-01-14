const Controller = require('./Controller');
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

  /**
   * Handling incoming requests
   * @param request
   * @param response
   * @param next - handling errors and other
   * @return {Response}
   */
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
      return next('handleNotFound');
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
      return next(new Error('Datasource does not support given query!'));
    }

    const result = datasourceSettings.datasource.select(query, (error) => {
      return next(error);
    });

    const metadata = this.createFragmentMetadata(request, query, datasourceSettings);

    const matchedGenerator = this.viewsGeneratorCollection.matchGenerator('triplePattern', request, next);
    const generator = this.viewsGeneratorCollection.getGenerator(matchedGenerator, next);

    const settings = {
      datasources: this.datasources,
      result,
      ...metadata,
      fragment: metadata.fragment,
      datasource: datasourceSettings,
      query
    };
    // console.log(settings);
    generator.render(settings, request, response, (error) => {
      if (error)
        response.emit('error', error);
      response.end();
      done && done();
    });
    //  return response;
  }

  /**
   * Extracts query parameters from URL
   * @param request
   * @return {{subject: string|null, predicate: string|null, object: string|null}}
   */
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

  /**
   * Extends prefix with full IRI defined in config
   * @param name
   * @return {string}
   */
  expandIRI (name) {
    // TODO: comment
    const prefixedNameMatcher = /^([a-z0-9-]*):([^/#:]*)$/i;
    const match = prefixedNameMatcher.exec(name);
    let prefix = null;

    return match && (prefix = this.prefixes[match[1]]) ? prefix + match[2] : name;
  }

  /**
   * Extract name of datasource from query
   * @param request
   * @return {string}
   */
  extractDatasource (request) {
    let datasource = /^\/?(.*)$/.exec(request.parsedUrl.pathname || '');
    datasource = datasource[1];
    return datasource;
  }

  /**
   * Extract limit and offset, if possible from url query
   * @param request
   * @return {{features: {limit: boolean}, limit: number, offset: number}}
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

  /**
   * Creates metadata about the fragment
   * @param request
   * @param query (subject, predicate, object)
   * @param datasourceSettings
   * @return {
   *    {
   *      datasource : {index: string, url: string, templateUrl: string},
   *      fragment:
   *        {url: string, pageUrl: string, firstPageUrl: string, nextPageUrl: string, previousPageUrl: string|null},
   *      query: {subject: string, predicate: string, object: string},
   *      prefixes: {prefixName: string},
   *      datasources: [object] }}
   */
  createFragmentMetadata (request, query, datasourceSettings) {
    const requestUrl = request.requestUrl;

    // Generate a textual representation of the pattern
    // eg. '{ ?s ?p ?o }' or '{ <subject> <predicate> <object> }'
    query.patternString = '{ ' +
      (query.subject ? '<' + query.subject + '> ' : '?s ') +
      (query.predicate ? '<' + query.predicate + '> ' : '?p ') +
      (N3Util.isIRI(query.object) ? '<' + query.object + '> ' : (query.object || '?o')) + ' }';

    return {
      datasource: _.assign(_.omit(datasourceSettings, 'datasource'), {
        index: requestUrl.indexUrl + '#dataset',
        url: requestUrl.datasourceUrl + '#dataset',
        templateUrl: requestUrl.datasourceUrl + '{?subject,predicate,object}'
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
}

module.exports = TriplePatternFragmentsController;
