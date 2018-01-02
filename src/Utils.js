module.exports = class Utils {
  static isObject (item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  static mergeDeep (target, source) {
    if (Utils.isObject(target) && Utils.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (Utils.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          Utils.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      });
    }
    return target;
  }
};
