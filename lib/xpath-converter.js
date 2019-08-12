'use strict';

const converter = require('./converter');
const Impl = require('./converter.impl');

class XpathConverter {
  constructor (spec) {
    if (!spec) {
      throw new Error('null spec not permitted');
    }

    Impl.validateSpec(spec);
    this.spec = spec;
  }

  /**
   * @function buildElement
   * @description: builds the native object representing an element and recurses in 2 dimensions;
   *    by the "recurse" attribute (usually "inherits") and via the element's direct descendants.
   *    The structure of the JSON object is defined by the Spec object passed as the spec param.
   *    buildElement uses the default spec. To use a different spec, use buildElementWithSpec
   *    and pass in another one. Predefined specs are available as members on the exported specs
   *    object, or users can define their own.
   *
   * @param {XMLNode} elementNode: see @function buildElementWithSpec
   * @param {XMLNode} parentNode: see @function buildElementWithSpec
   * @param {callback(el:string)} getOptions: see @function buildElementWithSpec
   */
  buildElement (elementNode, parentNode, getOptions) {
    return Impl.buildElementWithSpec(elementNode, parentNode, this.spec, getOptions);
  }
}

module.exports = {
  XpathConverter: XpathConverter,
  specs: converter.specs
};
