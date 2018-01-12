const HTMLViewGenerator = require('../../HTMLViewGenerator');
const errorComp = require('../../../views/error/error.marko');
let instance = null;

class ErrorHTMLViewGenerator extends HTMLViewGenerator {
  constructor () {
    super('error');
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  render (settings, request, response) {
    this.basics.component = errorComp;

    this.renderLayout({
      ...settings,
      ...this.basics
    }, response);
  }
}

module.exports = ErrorHTMLViewGenerator;
