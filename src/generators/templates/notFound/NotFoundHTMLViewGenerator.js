
let instance = null;

class NotFoundHTMLViewGenerator {
  constructor () {
    if (!instance) {
      instance = this;
    }

    return instance;
  }
}

module.exports = NotFoundHTMLViewGenerator;
