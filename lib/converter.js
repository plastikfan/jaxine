const Impl = require('./converter.impl');
const R = require('ramda');

/**
 * @Object Specs
 * @description: Collection of predefined spec objects. Each spec has the following properties:
 * @member labels: Sub-object. Collection of labels used on the built object. The labels that can be
 *    defined are as follows:
 *    - element: (string) The name of the property that stores the XML element name.
 *    - descendants: The name of the property holding descendant XML elements structure.
 *    - text: (string) The name of the property holding text local to the XML element as raw text or CDATA text.
 *    (typically set to "_text")
 *    - attribute (string)[optional]: The name of the property that stores the attributes array (if
 *    attributesType = "Array")
 *    (typically set to "_attributes")
 * @member attributesType: (string) Determines how to hold attributes.Can be set to ("Member" | "Array")
 *    - "Member": the attribute is store as an attribute of the same name as a member variable.
 *    - "Array": all attributes of the element ar stored as an array of key/value pairs
 * @member descendants (optional): Sub-object:
 *    - "by": (string) Determines how descendants are structured ("index" | "group"). By default,
 *    descendants will be stored as an array. Can be restructured into a map object where each
 *    descendant is keyed by the attribute. ("index": id attribute must be unique, "group" is does
 *    not have to be unique. In this case, descendants with the same name will be grouped into an
 *    array).
 *    - "attribute": (string) the name of the attribute to index/group by.
 * @member trim: (boolean) Removes leading and trailing spaces from element text. If trim is
 *    missing, it defaults to true.
 */
const Specs = {
  default: {
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text'
    },
    attributesType: 'Member'
  },

  indexByName: { // name attribute value must be unique
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text',
      attribute: '_attributes'
    },
    attributesType: 'Member',
    descendants: {
      by: 'index',
      attribute: 'name'
    }
  },
  groupByName: { // name attribute does not have to be unique
    labels: {
      element: '_',
      descendants: '_children',
      text: '_text',
      attribute: '_attributes'
    },
    attributesType: 'Member',
    descendants: {
      by: 'group',
      attribute: 'name'
    }
  }
};

/**
 * @function buildElementWithSpec
 * @description: Curried version of buildElement.
 *
 */
const buildElementWithSpec = R.curry((elementNode, parentNode, getOptions, spec) => {
  Impl.validateSpec(spec);
  return Impl.buildElement(elementNode, parentNode, getOptions, spec);
});

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
 * @param {Object} spec: Describes structure of the built JSON object.
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

module.exports = {
  specs: Specs,
  buildElement: buildElement,
  buildElementWithSpec: buildElementWithSpec,
  validateSpec: Impl.validateSpec
};
