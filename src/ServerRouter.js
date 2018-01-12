const ErrorController = require('./controllers/ErrorController');
const NotFoundController = require('./controllers/NotFoundController');
const AssetsController = require('./controllers/AssetsController');
const DereferenceController = require('./controllers/DereferenceController');
const TriplePatternFragmentsController = require('./controllers/TriplePatternFragmentsController');
const Router = require('router');
const parseForwarded = require('forwarded-parse');
const url = require('url');
const _ = require('lodash');

require('marko/node-require').install();

const PLAINTEXT = 'text/plain;charset=utf-8';

class ServerRouter {
  constructor (config, viewsGeneratorCollection) {
    /**
     * Router
     * @type {Router}
     */
    this.router = new Router({});
    /**
     * All config data
     * loaded from config.json file and other which are added later
     * @type {object}
     */
    this.config = config;
    /**
     * Logger
     * @type {Winston}
     */
    this.logger = this.config.logging.logger;

    // NOTE: maybe would be beneficial to add some DI container
    /**
     * Array of controllers
     * @type {{TriplePatternFragmentsController: TriplePatternFragmentsController, AssetsController: AssetsController, DereferenceController: DereferenceController, ErrorController}}
     */
    this.controllers = {
      TriplePatternFragmentsController: new TriplePatternFragmentsController(this.config, this.logger, viewsGeneratorCollection),
      AssetsController: new AssetsController(this.config, this.logger),
      DereferenceController: new DereferenceController(this.config, this.logger),
      ErrorController: new ErrorController(this.config, this.logger),
      NotFoundController: new NotFoundController(this.config, this.logger)
    };

    // sets all routes, which are defined below
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
     * accessible from /assets folder and its sub-folders
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
     * NOTE: think of better solution
     */
    this.router.get('/*', (req, res, params) => {
      req = this.parseUrlAndHeaders(req);

      const next = (message) => {
        if (message instanceof Error) {
          this.reportError(req, res, message);
        } else {
          if (message === 'handleNotFound') {
            this.controllers.NotFoundController.handle(req, res, next);
          } else if (message === 'handleNotAcceptable') {
            ServerRouter.handleNotAcceptable(res);
          }
        }
      };

      this.controllers.TriplePatternFragmentsController.handle(req, res, next);
    });

    /**
     * All other methods, which are not mentioned before
     */
    this.router.all('*', (req, res, params) => {
      res.writeHead(405, { 'Content-Type': PLAINTEXT });
      res.end(`The HTTP method ${req.method} is not allowed; try "GET" instead.`);
    });
  }

  /**
   * Returns instance of Router
   * @returns {Router}
   */
  get getRoutes () {
    return this.router;
  }

  /**
   * Modifies Node.js request object, adds parsed URL, headers, query
   * @param request
   * @returns {Request}
   */
  parseUrlAndHeaders (request) {
    this._baseUrl = _.mapValues(url.parse(this.config.baseURL || '/'), function (value, key) {
      return value && !/^(?:href|path|search|hash)$/.test(key) ? value : undefined;
    });

    if (!request.parsedUrl) {
      request.parsedUrl = _.defaults(_.pick(url.parse(request.url, true), 'path', 'pathname', 'query'),
        this._baseUrl,
        ServerRouter.getForwardedHeaders(request),
        ServerRouter.getXForwardedHeaders(request),
        { protocol: 'http:', host: request.headers.host });
    }

    const requestUrl = request.parsedUrl;

    request.requestUrl = {};
    request.requestUrl.origQuery = request.url.replace(/[^?]+/, '');
    request.requestUrl.pageUrl = url.format(requestUrl).replace(/\?.*/, request.requestUrl.origQuery);
    request.requestUrl.paramsNoPage = _.omit(requestUrl.query, 'page');
    request.requestUrl.currentPage = parseInt(requestUrl.query.page, 10) || 1;
    request.requestUrl.datasourceUrl = url.format(_.omit(requestUrl, 'query'));
    request.requestUrl.fragmentUrl = url.format(_.defaults({query: request.requestUrl.paramsNoPage}, requestUrl));
    request.requestUrl.fragmentPageUrlBase = request.requestUrl.fragmentUrl + (/\?/.test(request.requestUrl.fragmentUrl) ? '&' : '?') + 'page=';
    request.requestUrl.indexUrl = url.format(_.omit(requestUrl, 'search', 'query', 'pathname')) + '/';

    // maintain the originally requested query string to avoid encoding differences

    return request;
  }

  /**
   * Parses Forwarded Headers in request
   * @param {Request} request
   * @return {{protocol: string, host: string} || {}}
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

  /**
   * Parses X-Forwarded Headers in request
   * @param request
   * @return {{protocol: String, host: String} || {}}
   */
  static getXForwardedHeaders (request) {
    return {
      protocol: request.headers['x-forwarded-proto'] ? request.headers['x-forwarded-proto'] + ':' : undefined,
      host: request.headers['x-forwarded-host']
    };
  }

  /**
   * Handling negotiation failure
   * @param {Response} response
   * @returns void
   */
  static handleNotAcceptable (response) {
    response.writeHead(406, { 'Content-Type': PLAINTEXT });
    response.end('No suitable content type found.\n');
  }

  /**
   * Handling no view found
   * @param request
   * @param {Response} response
   */
  static handleNotFound (request, response) {
    response.writeHead(404, { 'Content-Type': PLAINTEXT });
    response.end(request.url + ' not found\n');
  };

  /**
   * Handling errors
   * @param request
   * @param response
   * @param error
   */
  reportError (request, response, error) {
    // Log the error
    this.logger.error(error.stack);

    // Try to report the error in the response
    try {
      // Ensure errors are not handled recursively, and don't modify an already started response
      if (response.error || response.headersSent) {
        return response.end();
      }
      response.error = error;
      this.controllers.ErrorController.handle(request, response, _.noop);
    } catch (responseError) {
      this.logger.error(responseError.stack);
    }
  };

  /**
   * Exits controllers
   */
  stop () {
    // Close all controllers
  };
}

module.exports = ServerRouter;
