
const Impl = require('./converter.impl');

/**
 * @function buildElement
 * @description: builds the native object representing an element, and recurses in 2 dimensions;
 *    by the "recurse" attribute (usually "inherits") and via the element's direct descendants.
 * @param {XMLNode} elementNode: the XML node which is to be built.
 * @param {XMLNode} parentNode: the XML node which is the immediate parent of the element.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @returns an object in generic format eg:
 *{
   'name': 'test',
   '_': 'Command',
   '_children': [{
         '_': 'Arguments',
         '_children': [{
           'name': 'config',
           '_': 'ArgumentRef'
         }, {
           'name': 'expr',
           '_': 'ArgumentRef'
         }, {
           'name': 'input',
           '_': 'ArgumentRef'
         }]
       }, {
         '_': 'ArgumentGroups',
         '_children': [{
               '_': 'Implies',
  ...
  The object is in a non-normalised format and is keyed by its "id" in the above example "name".
  All objects have an "_" attribute which identifies the xml element name.
 */
function buildElement (elementNode, parentNode, getOptions) {
  return Impl.buildElement(elementNode, parentNode, getOptions);
}

module.exports = {
  buildElement: buildElement
};
