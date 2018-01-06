'use strict';

const http = require('http');

class LDFragmentServer {
  constructor (config) {
    this.config = config;
    this.server = {};
    this.logger = this.config.logging.logger;
    this.router = {};
  }

  set setRouter (router) {
    this.router = router;
  }

  createServer () {
    // TODO: add https variant
    this.server = http.createServer();

    this.server.on('request', (req, res) => {
      // execute parsing
      // add default headers from config
      this.logger.info(`New request - pathname: ${req.url}`);
      this.router.getRouter(req, res, this.logger);
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
