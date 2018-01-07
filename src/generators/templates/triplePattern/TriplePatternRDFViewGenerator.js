
let instance = null;

class TriplePatternRDFViewGenerator {
  constructor () {
    if (!instance) {
      instance = this;
    }

    return instance;
  }
}

module.exports = TriplePatternRDFViewGenerator;
