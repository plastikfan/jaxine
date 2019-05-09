const Impl = require('./converter.impl');
const R = require('ramda');

/**
 * @Object Specs
 * @description: Collection of predefined spec objects. Each spec has the following properties:
 * @member labels: Sub-object. Collection of labels used on the built object. The labels that can be
 *    defined are as follows:
 *    - element: (string) The name of the property that stores the XML element name.
 *    - descendants: The name of the property holding descendant XML elements structure.
 *    (typically set to "_children")
 *    - text: (string) The name of the property holding text local to the XML element as raw
 *    text or CDATA text. (typically set to "_text")
 *    - attribute (string)[optional]: The name of the property that stores the attributes array.
 *    (typically set to "_attributes")
 * @member descendants (optional): Sub-object:
 *    - "by": (string) Determines how descendants are structured ("index" | "group"). By default,
 *    descendants will be stored as an array. Alternatively, they can be restructured into a map
 *    object where each descendant is keyed by the attribute. (when by = "index": value of
 *    attribute must be unique, when by = "group" then attribute value does not have to be unique.
 *    In this case, descendants with the same name will be grouped into an array).
 *    - "attribute": (string) the name of the attribute to index/group by.
 *    - "throwIfCollision": (boolean) [default:false] If there are multiple child elements that have
 *    the same key value (descendants.attribute), then the groupBy/indexBy function will not be
 *    invoked and they will be returned as an array (and hence not indexable). If throwIfCollision
 *    is true, then an exception will be thrown (does not apply to groupBy/by="group").
 *    - "throwIfMissing": (boolean). Similar to "throwIfCollision", but an exception will be thrown
 *    if the child element does not contain the attribute as defined in descendants.attribute.
 * @member trim: (boolean) [default:false] Removes leading and trailing spaces from element text.
 */
const Specs = {
  default: {
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text'
    },
    trim: true
  },

  indexByName: { // name attribute value must be unique
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text',
      attribute: '_attributes'
    },
    descendants: {
      by: 'index',
      attribute: 'name',
      throwIfCollision: true,
      throwIfMissing: true
    },
    trim: true
  },

  groupByName: { // name attribute does not have to be unique
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text',
      attribute: '_attributes'
    },
    descendants: {
      by: 'group',
      attribute: 'name',
      throwIfMissing: true
    },
    trim: true
  }
};

Object.freeze(Specs);

/**
 * @function buildElement
 * @description: builds the native object representing an element and recurses in 2 dimensions;
 *    by the "recurse" attribute (usually "inherits") and via the element's direct descendants.
 *    The structure of the JSON object is defined by the Spec object passed as the spec param.
 *    buildElement uses the default spec. To use a different spec, use buildElementWithSpec
 *    and pass in another one. Predefined specs are available as members on the exported specs
 *    object, or users can define their own.
 *
 * @param {XMLNode} elementNode: the XML node which is to be built.
 * @param {XMLNode} parentNode: the XML node which is the immediate parent of the element.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @returns {Object} an object in generic format eg:
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
  return buildElementWithSpec(elementNode, parentNode, getOptions, Specs.default);
}

/**
 * @function buildElementWithSpec
 * @description: Curried version of buildElement.
 *
 * @param {XMLNode} elementNode: the XML node which is to be built.
 * @param {XMLNode} parentNode: the XML node which is the immediate parent of the element.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @param {Object} spec: Describes structure of the built JSON object.
 */
const buildElementWithSpec = R.curry((elementNode, parentNode, getOptions, spec) => {
  Impl.validateSpec(spec);
  return Impl.buildElement(elementNode, parentNode, getOptions, spec);
});

module.exports = { // !! KEEP IN SYNC WITH index.js
  specs: Specs,
  buildElement: buildElement,
  buildElementWithSpec: buildElementWithSpec,
  validateSpec: Impl.validateSpec
};
