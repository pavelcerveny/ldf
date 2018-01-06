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

  handle (req, res) {
    const entity = url.format(_.defaults({
      pathname: '/' + req.dereference,
      query: { subject: url.format(req.parsedUrl) }
    }, req.parsedUrl));

    res.writeHead(303, { 'Location': entity, 'Content-Type': PLAINTEXT });
    res.end(entity);
  }
}

module.exports = DereferenceController;
