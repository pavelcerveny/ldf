const ViewGenerator = require('./ViewGenerator');

const contentTypes = 'text/html';

class HTMLViewGenerator extends ViewGenerator {
  constructor (name) {
    super(name, contentTypes);
  }
}

module.exports = HTMLViewGenerator;
