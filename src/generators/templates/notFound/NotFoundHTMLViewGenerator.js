const HTMLViewGenerator = require('../../HTMLViewGenerator');
const notFoundComp = require('../../../views/notFound/notFound.marko');
let instance = null;

class NotFoundHTMLViewGenerator extends HTMLViewGenerator {
  constructor () {
    super('notFound');
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  render (settings, request, response) {
    this.basics.component = notFoundComp;

    this.renderLayout({
      data: {
        ...settings
      },
      ...this.basics
    }, response);
  }
}

module.exports = NotFoundHTMLViewGenerator;
