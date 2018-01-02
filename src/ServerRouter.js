const AssetsController = require('./controllers/AssetsController');
const TriplePatternFragmentsController = require('./controllers/TriplePatternFragmentsController');
const Router = require('router');
const parseForwarded = require('forwarded-parse');

require('marko/node-require').install();
const indexTemplate = require('./views/index.marko');

const PLAINTEXT = 'text/plain;charset=utf-8';

class ServerRouter {
  constructor (config, logger) {
    this.router = new Router({});
    this.config = config;
    this.logger = logger;

    this.router.head('*', (req, res, params) => {
      res.write = function () {};
      res.end = res.end.bind(res, '', '');
    });

    this.router.options('*', (req, res, params) => {
      res.write = function () {};
      res.end = res.end.bind(res, '', '');
    });

    this.router.get('/', (req, res, params) => {
      // res.end('{"message":"hello world"}')
      indexTemplate.render({
        assetsPath: 'assets',
        baseURL: '/',
        header: ''
      }, res);
      new TriplePatternFragmentsController(this.config, req, logger);

    });

    this.router.get('/assets/*', (req, res, params) => {
      AssetsController(req, res);
    });

    this.router.get('*', (req, res, params) => {
      // error
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
        host: forwarded.host,
      };
    }
    catch (error) {
      this.logger.error(`Unable to parse HTTP Forwarded header ${error}`);
      return {};
    }
  }

  static getXForwardedHeaders (request) {
    return {
      protocol: request.headers['x-forwarded-proto'] ? request.headers['x-forwarded-proto'] + ':' : undefined,
      host: request.headers['x-forwarded-host'],
    };
  }

  /**
   * Handling negotiation failure
   * @param {ServerResponse} response
   * @returns void
   */
  handleNotAcceptable (response) {
    response.writeHead(406, { 'Content-Type': PLAINTEXT });
    response.end('No suitable content type found.\n');
  }
}

module.exports = ServerRouter;
