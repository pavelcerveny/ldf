module.exports = {
  capitalizeFirst: function(string) {
    return string && !/[A-Z]/.test(string) ? string[0].toUpperCase() + string.slice(1) : string;
  },
  shorten: function (entity) {
    return entity.match(/([^\/#]*)[\/#]?$/)[1] || entity;
  },
  formatNumber: function (number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
};
