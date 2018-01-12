const url = require('url');
const _ = require('lodash');
const Controller = require('./Controller');
const PLAINTEXT = 'text/plain;charset=utf-8';

let instance; // singleton hack

class DereferenceController extends Controller {
  constructor (config, logger) {
    super(config, logger);

    if (!instance) {
      instance = this;
    }

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
    const entity = url.format(_.defaults({
      pathname: '/' + request.dereference,
      query: { subject: url.format(request.parsedUrl) }
    }, request.parsedUrl));

    response.writeHead(303, { 'Location': entity, 'Content-Type': PLAINTEXT });
    response.end(entity);
  }
}

module.exports = DereferenceController;
