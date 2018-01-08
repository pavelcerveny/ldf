const HTMLViewGenerator = require('../../HTMLViewGenerator');
let instance = null;

class NotFoundHTMLViewGenerator extends HTMLViewGenerator {
  constructor () {
    super('notFound');
    if (!instance) {
      instance = this;
    }

    return instance;
  }
}

module.exports = NotFoundHTMLViewGenerator;
