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

  /**
   * Starts the server and set up router for matching
   */
  createServer () {
    // TODO: add https variant
    // TODO: add sockets
    this.server = http.createServer();

    this.server.on('request', (req, res) => {
      this.logger.info(`New request - pathname: ${req.url}`);
      // execute router matching
      this.router.getRouter(req, res);
    });

    this.server.on('error', (request, response, error) => {
      // If no request or response is available, the server failed outside of a request; don't recover
      request = null;
      response = null;
      this.logger.error(`Fatal error, exiting process:\n ${error.stack}`);
      return process.exit(-1);
    });

    this.server.listen(3000, error => {
      if (error) {
        this.logger.error(`Fatal error, exiting process:\n ${error.stack}`);
        return process.exit(-1);
      }
      this.logger.info(`Server listening on: http://localhost:3000`);
    });
  }

  /**
   * Stops server and router
   */
  stopServer () {
    this.router.stop();
    this.server.close();
  }
}

module.exports = LDFragmentServer;
