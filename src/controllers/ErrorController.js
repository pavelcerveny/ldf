const _ = require('lodash');
const Controller = require('./Controller');

let instance; // singleton hack

class ErrorController extends Controller {
  constructor (config, logger, viewsGeneratorCollection) {
    super(config, logger);

    if (!instance) {
      instance = this;
    }
    this.viewsGeneratorCollection = viewsGeneratorCollection;
    return instance;
  }

  /**
   * Handling incoming requests
   * @param request
   * @param response
   * @param next - handling errors and other
   * @return {Response}
   */
  handle (response, request, next) {
    const error = response.error || (response.error = new Error('Unknown error'));
    const metadata = {
      prefixes: this.prefixes,
      datasources: this.datasources,
      error
    };
    const matchedGenerator = this.viewsGeneratorCollection.matchGenerator('error', request, next);
    const generator = this.viewsGeneratorCollection.getGenerator(matchedGenerator, next);

    response.writeHead(500);

    generator.render(metadata, request, response, (error) => {
      next(error);
    });
    return response;
  }
}

module.exports = ErrorController;
