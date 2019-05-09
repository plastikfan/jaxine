const Converter = require('./lib/converter');

module.exports = {
  specs: Converter.specs,
  buildElement: Converter.buildElement,
  buildElementWithSpec: Converter.buildElementWithSpec,
  validateSpec: Converter.validateSpec
};
