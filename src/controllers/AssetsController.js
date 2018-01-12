const url = require('url');
const fs = require('fs');
const path = require('path');

const Controller = require('./Controller');

let instance; // singleton hack

class AssetsController extends Controller {
  constructor (config, logger) {
    super(config, logger);

    if (!instance) {
      instance = this;
    }

    return instance;
  }

  /**
   * Handling incoming requests
   * @param req
   * @param res
   * @param next - handling errors and other
   * @return {Response}
   */
  handle (req, res, next) {
    const parsedUrl = url.parse(req.url);
    // extract URL path
    let pathname = `.${parsedUrl.pathname}`;
    pathname = pathname.replace(/^(\.)+/, '.');
    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext;
    // maps file extention to MIME typere
    const map = {
      '.ico': 'image/x-icon',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword'
    };

    let fd = null;
    try {
      fd = fs.openSync(pathname, 'r');
    } catch (exception) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return res;
    }

    try {
      const data = fs.readFileSync(fd);
      res.setHeader('Content-type', map[ext] || 'text/plain');
      res.setHeader('Cache-Control', 'public,max-age=1209600'); // 14 days
      res.end(data);
    } catch (exception) {
      res.statusCode = 500;
      res.end(`Error getting the file: ${exception}.`);
    }
    return res;
  }
}

module.exports = AssetsController;
