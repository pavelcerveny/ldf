const RDFViewGenerator = require('../../RDFViewGenerator');
let instance = null;

class NotFoundRDFViewGenerator extends RDFViewGenerator {
  constructor () {
    super('notFound');
    if (!instance) {
      instance = this;
    }

    return instance;
  }

  render (settings, request, response, done) {
    if (!settings.contentType) {
      settings.contentType = response.getHeader('Content-Type');
    }
    const newSettings = this.getWriter(settings, request, response, done);
    const writer = newSettings.writer;

    this.addDatasources(newSettings, writer.data, writer.meta);
    writer.end();
  }
}

module.exports = NotFoundRDFViewGenerator;
