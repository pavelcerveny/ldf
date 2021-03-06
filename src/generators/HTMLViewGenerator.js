require('marko/node-require').install();
const ViewGenerator = require('./ViewGenerator');
const layout = require('../views/layout.marko');

const contentTypes = 'text/html';

class HTMLViewGenerator extends ViewGenerator {
  constructor (name) {
    super(name, contentTypes);

    this.basics = {
      assetsPath: 'assets',
      baseURL: '/',
      header: '',
      component: null
    };
  }

  /**
   * Renders layout base template
   * @param data
   * @param response
   */
  renderLayout (data, response) {
    layout.render(data, response);
  }
}

module.exports = HTMLViewGenerator;
