const PLAINTEXT = 'text/plain;charset=utf-8';

module.exports = class Utils {
  static isObject (item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  /**
   * Handling negotiation failure
   * @param {Response} response
   * @returns void
   */
  static handleNotAcceptable (response) {
    response.writeHead(406, { 'Content-Type': PLAINTEXT });
    response.end('No suitable content type found.\n');
  }

  /**
   * Handling no view found
   * @param request
   * @param {Response} response
   */
  static handleNotFound (request, response) {
    response.writeHead(404, { 'Content-Type': PLAINTEXT });
    response.end(request.url + ' not found\n');
  };
};
