const Controller = require('./Controller');

let instance; // singleton hack

class NotFoundController extends Controller {
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
  handle (request, response, next) {
    response.setHeader('Cache-Control', 'public,max-age=3600');
    response.writeHead(404);

    const metadata = {
      url: request.url,
      prefixes: this.prefixes,
      datasources: this.datasources
    };

    const matchedGenerator = this.viewsGeneratorCollection.matchGenerator('notFound', request, next);
    const generator = this.viewsGeneratorCollection.getGenerator(matchedGenerator, next);

    generator.render(metadata, request, response, (error) => {
      next(error);
    });

    return response;
  }
}

module.exports = NotFoundController;
