const _ = require('lodash');
const Controller = require('./Controller');

let instance; // singleton hack

class ErrorController extends Controller {
  constructor (config, logger) {
    super(config, logger);

    if (!instance) {
      instance = this;
    }

    return instance;
  }

  handle (response, request, next) {
    const error = response.error || (response.error = new Error('Unknown error'));
    const metadata = {
      prefixes: this._prefixes,
      datasources: this._datasources,
      error: error
    };
    const matchedGenerator = this.viewsGeneratorCollection.matchGenerator('error', request);
    const generator = this.viewsGeneratorCollection.getGenerator(matchedGenerator);

    response.writeHead(500);

    generator.render(settings, request, response, (error) => {
      next(error);
    });
    return response;
  }
}

module.exports = ErrorController;
