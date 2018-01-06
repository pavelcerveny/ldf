const url = require('url');
const _ = require('lodash');
const Controller = require('./Controller');
const PLAINTEXT = 'text/plain;charset=utf-8';

let instance; // singleton hack

class NotFoundController extends Controller {
  constructor (config, logger) {
    super(config, logger);

    if (!instance) {
      instance = this;
    }

    return instance;
  }

  handle (request, response) {
    // response.setHeader('Cache-Control', 'public,max-age=3600');
    // const view = this._negotiateView('NotFound', request, response),
    //   metadata = { url: request.url, prefixes: this._prefixes, datasources: this._datasources };
    // response.writeHead(404);
    // view.render(metadata, request, response);
  }
}

module.exports = NotFoundController;
