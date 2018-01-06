const AssetsController = require('./controllers/AssetsController');
const DereferenceController = require('./controllers/DereferenceController');
const TriplePatternFragmentsController = require('./controllers/TriplePatternFragmentsController');
const Router = require('router');
const parseForwarded = require('forwarded-parse');
const url = require('url');
const _ = require('lodash');

require('marko/node-require').install();
const indexTemplate = require('./views/index.marko');

const PLAINTEXT = 'text/plain;charset=utf-8';

class ServerRouter {
  constructor (config) {
    this.router = new Router({});
    this.config = config;
    this.logger = this.config.logging.logger;
    this.controllers = {
      TriplePatternFragmentsController: new TriplePatternFragmentsController(this.config, this.logger),
      AssetsController: new AssetsController(this.config, this.logger),
      DereferenceController: new DereferenceController(this.config, this.logger)
    };

    this.setRoutes();
  }

  setRoutes () {
    /**
     * HEAD and OPTIONS methods should have no body
     */
    this.router.head('*', (req, res, params) => {
      res.write = function () {};
      res.end = res.end.bind(res, '', '');
    });

    /**
     * HEAD and OPTIONS methods should have no body
     */
    this.router.options('*', (req, res, params) => {
      res.write = function () {};
      res.end = res.end.bind(res, '', '');
    });

    /**
     * Route for all static assets
     */
    this.router.get('/assets/*', (req, res, params) => {
      this.controllers.AssetsController.handle(req, res);
    });

    /**
     * Auto-generate routes for dereferencing defined in config
     * eg. { '/resource/': 'dbpedia'} -> '/resource/dbpedia
     */
    for (const [key, value] of Object.entries(this.config.dereference)) {
      this.router.get(`${key}${value}*`, (req, res, params) => {
        req.dereference = value;
        req.datasource = key;
        this.controllers.DereferenceController.handle(this.parseUrlAndHeaders(req), res);
      });
    }

    /**
     * Single relevant endpoint for extracting fragments
     * - all other arguments are given via GET parameters (matching for other parameters must be done in Controller itself)
     * TODO: think of better solution
     */
    this.router.get('/*', (req, res, params) => {
      indexTemplate.render({
        assetsPath: 'assets',
        baseURL: '/',
        header: ''
      }, res);
      this.controllers.TriplePatternFragmentsController.handle(this.parseUrlAndHeaders(req), res, () => {});
    });

    // all other http methods
    this.router.all('*', (req, res, params) => {
      res.writeHead(405, { 'Content-Type': PLAINTEXT });
      res.end(`The HTTP method ${req.method} is not allowed; try "GET" instead.`);
    });
  }

  get getRouter () {
    return this.router;
  }

  parseUrlAndHeaders (request) {
    this._baseUrl = _.mapValues(url.parse(this.config.baseURL || '/'), function (value, key) {
      return value && !/^(?:href|path|search|hash)$/.test(key) ? value : undefined;
    });

    request.parsedUrl = _.defaults(_.pick(url.parse(request.url, true), 'path', 'pathname', 'query'),
      this._baseUrl,
      ServerRouter.getForwardedHeaders(request),
      ServerRouter.getXForwardedHeaders(request),
      { protocol: 'http:', host: request.headers.host });

    const requestUrl = request.parsedUrl;
    
    request.requestUrl = {
      origQuery: request.url.replace(/[^?]+/, ''),
      pageUrl: url.format(requestUrl).replace(/\?.*/, request.requestUrl.origQuery),
      paramsNoPage: _.omit(requestUrl.query, 'page'),
      currentPage: parseInt(requestUrl.query.page, 10) || 1,
      datasourceUrl: url.format(_.omit(requestUrl, 'query')),
      fragmentUrl: url.format(_.defaults({query: request.requestUrl.paramsNoPage}, requestUrl)),
      fragmentPageUrlBase: request.requestUrl.fragmentUrl + (/\?/.test(request.requestUrl.fragmentUrl) ? '&' : '?') + 'page=',
      indexUrl: url.format(_.omit(requestUrl, 'search', 'query', 'pathname')) + '/'
    };
      // maintain the originally requested query string to avoid encoding differences


    return request;
  }

  /**
   *
   * @param {IncomingMessage} request
   */
  static getForwardedHeaders (request) {
    if (!request.headers.forwarded) {
      return {};
    }

    try {
      const forwarded = parseForwarded(request.headers.forwarded);
      return {
        protocol: forwarded.proto ? forwarded.proto + ':' : undefined,
        host: forwarded.host
      };
    } catch (error) {
      this.logger.error(`Unable to parse HTTP Forwarded header ${error}`);
      return {};
    }
  }

  static getXForwardedHeaders (request) {
    return {
      protocol: request.headers['x-forwarded-proto'] ? request.headers['x-forwarded-proto'] + ':' : undefined,
      host: request.headers['x-forwarded-host']
    };
  }

  /**
   * Handling negotiation failure
   * @param {ServerResponse} response
   * @returns void
   */
  static handleNotAcceptable (response) {
    response.writeHead(406, { 'Content-Type': PLAINTEXT });
    response.end('No suitable content type found.\n');
  }
}

module.exports = ServerRouter;
