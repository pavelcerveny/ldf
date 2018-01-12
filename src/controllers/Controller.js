class Controller {
  constructor (config, logger) {
    this.config = config;
    this.logger = logger;

    this.prefixes = this.config.prefixes;
    this.datasources = this.config.datasources;
  }

  handle (request, response, next) {
    console.log('abstract method');
  }
}

module.exports = Controller;
