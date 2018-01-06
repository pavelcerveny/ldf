const negotiate = require('negotiate');

class Controller {
  constructor (config, logger) {
    this.config = config;
    this.logger = logger;

    this.prefixes = this.config.prefixes;
    this.datasources = this.config.datasources;
  }

  handle (request, response) {
    console.log('abstract method');
  }

  negotiateView (viewName, request, response) {
    // Indicate that the response is content-negotiated
    const vary = response.getHeader('Vary');
    response.setHeader('Vary', 'Accept' + (vary ? ', ' + vary : ''));
    // Negotiate a view



    var viewMatch = this._views.matchView(viewName, request);
    response.setHeader('Content-Type', viewMatch.responseType || viewMatch.type);
    return viewMatch.view;
  };



}

module.exports = Controller;
