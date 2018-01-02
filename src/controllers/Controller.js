const negotiate = require('negotiate');

class Controller {
  constructor (options, request, logger) {

    this.logger = logger;
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
