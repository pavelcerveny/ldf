'use strict';

const http = require('http');
const ServerRouter = require('./ServerRouter');

class LDFragmentServer {
  constructor (options) {
    this.options = options;
    this.server = {};
    this.logger = this.options.logging.logger;
    this.router = new ServerRouter(options, this.logger);
  }

  // set setRouter (router) {
  //   this.router = router;
  // }

  createServer () {
    // TODO: add https variant
    this.server = http.createServer();

    this.server.on('request', (req, res) => {
      // execute parsing
      // add default headers from config
      this.logger.info('New request');
      this.router.getRouter(req, res, this.logger);
      console.log([req, res]);
      // this.router.handleRoutes(req, res);
    });

    this.server.on('error', (req, res) => {

    });

    this.server.listen(3000, err => {
      if (err) throw err;
      console.log('Server listening on: http://localhost:3000')
    });
  }

  reportError (request, response, error) {

  }

  stopServer () {
    this.server.close();
  }
}

module.exports = LDFragmentServer;
