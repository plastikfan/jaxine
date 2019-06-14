const Impl = require('./converter.impl');
const R = require('ramda');

const defaultSpec = Object.freeze({
  name: 'default-spec',
  labels: {
    element: '_',
    descendants: '_children',
    text: '_text'
  },
  // @deprecated, moving to textNodes.trim
  //
  trim: true
});

const attributesAsArraySpec = Object.freeze({
  name: 'attributes-as-array-spec',
  labels: {
    attributes: '_attributes',
    element: '_',
    descendants: '_children',
    text: '_text'
  },
  // @deprecated, moving to textNodes.trim
  //
  trim: true
});

const fullSpec = Object.freeze({
  name: 'full-spec',
  labels: {
    element: '_',
    descendants: '_children',
    text: '_text'
  },
  coercion: {
    attributes: {
      trim: true,
      matchers: {
        primitives: ['number', 'boolean'],
        collection: {
          delim: ',',
          open: '!<type>[',
          close: ']',
          assoc: {
            delim: '=',
            valueType: 'string'
          }
        },
        date: {
          format: 'YYYY-MM-DD'
        },
        symbol: {
          prefix: '$',
          global: true
        },
        string: true
      }
    },
    textNodes: {
      trim: true,
      matchers: {
        collection: {
          // The following properties are not appropriate for textNodes, because the
          // constituents are already natively split: "delim", "open", "close"
          //
          assoc: {
            delim: '=', // required for map types (key/value pair) collection types
            // valueType: the name (or an array of) of a primitive type(s)
            //
            valueType: 'string'
          }
        },
        date: {
          format: 'YYYY-MM-DD'
        },
        symbol: {
          prefix: '$',
          global: true
        },
        string: true // if false, then throw; defaults to true
      }
    }
  }
});

/**
 * @Object Specs
 * @description: Collection of predefined spec objects. Each spec has the following properties:
 * @member labels: {Object}. Collection of labels used on the built object. The labels that can be
 *    defined are as follows:
 *    @member element: (@type:string) The name of the property that stores the XML element name.
 *    @member descendants: (@type:string) The name of the property holding descendant XML
 *    elements structure.(typically set to "_children")
 *    @member text: (@type:string) The name of the property holding text local to the
 *    XML element as rawtext or CDATA text. (typically set to "_text")
 *    @member attribute (@type:string)[optional]: The name of the property that stores
 *    the attributes array.(typically set to "_attributes")
 * @member coercion: {Object} [optional]. Defines how values read from XML are coerced. If missing,
 *    coercion is disabled and all values interpreted as a raw string.
 *    @member attributes: (coercion that applies to element attributes).
 *      @member trim (@type:boolean) [default:false]: Trim attribute values.
 *      @member matchers: {Object} Defines the different formats the attribute value can be
 *      interpreted as. The order of the defined matchers is significant and controls the
 *      sequence in which each matcher is used to extract the value. When a matcher is
 *      successful in extracting the value, the search stops. The last matcher is implicitly
 *      the String type, but you can define it explicitly as a boolean. If set to false,
 *      then an exception is thrown instead of extracting the value as a raw string.
 *        @member collection: {Object} Represents various array types and Set/WeakSet/Map etc
 *          @member delim (@type:string)[default:',']: separator used to determine
 *          individual values for the collection.
 *          @member open (@type:string)[default:'!<[]]>']: The pattern (not a full regexp,
 *          but will be used to build a one) used to denote a collection to be built.
 *          May contain "<type>", which is used to identify the type of collection required.
 *          If missing then then default will be to create a vanilla array([]). Eg, if a Map
 *          is required, the the pattern should include "<Map>".
 *          @member close (@type:string)[default:']']: The pattern used as pattern of the
 *          composed regexp (along with "open").
 *          @member assoc: {Object}
 *            @member delim (@type:string)[default:'=']: Only required for key/value type
 *            collections, separates the key from the value.
 *            @member valueType (@type:string)[default:'string']: The type used to coerce
 *            individual collection values.
 *
 *          @member date: {Object}
 *            @member format (@type:string): The date format. (See momentjs)
 *          @member symbol {Object}
 *            @member prefix:
 *            @member global:
 *    @member textNodes: coercion that applies to child text nodes.
 *      @member combine (@type: boolean or @type: Object) [default:true]. If false,
 *      then apply the same applicable settings that are defined under spec.coercion.attribute.
 *      If set to "true", then child text nodes will be combined into a single value.
 * @member trim: (@type:boolean) @deprecated [default:false] Removes leading
 *    and trailing spaces from element text.
 */
const Specs = {
  default: defaultSpec,
  attributesAsArraySpec: attributesAsArraySpec,
  fullSpec: fullSpec,
  fullSpecWithDefaults: Impl.fullSpecWithDefaults
};

Object.freeze(Specs);

/**
 * @function buildElementWithSpec
 * @description: Curried version of buildElement.
 *
 * @param {XMLNode} elementNode: the XML node which is to be built.
 * @param {XMLNode} parentNode: the XML node which is the immediate parent of the element.
 * @param {Object} spec: Describes structure of the built JSON object.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (
 *    @member:"id": the attribute that identifies an element, which usually should be unique,
 *    @member:"recurse" the attribute used for element inheritance,
 *    @member: "discards" the list of attributes that can be discarded and not appear in the JSON,
 *    @member descendants(optional): {Object}:
 *        @member "by": (string) Determines how descendants are structured ("index" | "group").
 *    By default,descendants will be stored as an array. Alternatively, they can be
 *    restructured into a map object where each descendant is keyed by the attribute.
 *    (when by = "index": value of attribute must be unique, when by = "group" then
 *    attribute value does not have to be unique. In this case, descendants with the same
 *    name will be grouped into an array).
 *        @member "attribute": (@type:string) the name of the attribute to index/group by.
 *        @member "throwIfCollision": (@type:boolean) [default:false] If there are multiple
 *    child elements that have the same key value (descendants.attribute), then the
 *    groupBy/indexBy function will not be invoked and they will be returned as an array
 *    (and hence not indexable). If throwIfCollision is true, then an exception will be
 *    thrown (does not apply to groupBy/by="group").
 *        @member "throwIfMissing": (@type:boolean). Similar to "throwIfCollision", but
 *    an exception will be thrown if the child element does not contain the attribute
 *    as defined in descendants.attribute).
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
const buildElementWithSpec = R.curry((elementNode, parentNode, spec, getOptions) => {
  return Impl.buildElementWithSpec(elementNode, parentNode, spec, getOptions);
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
 * @param {XMLNode} elementNode: see @function buildElementWithSpec
 * @param {XMLNode} parentNode: see @function buildElementWithSpec
 * @param {callback(el:string)} getOptions: see @function buildElementWithSpec
 */
function buildElement (elementNode, parentNode, getOptions) {
  return buildElementWithSpec(elementNode, parentNode, Specs.default, getOptions);
}

module.exports = { // !! KEEP IN SYNC WITH index.js
  specs: Specs,
  buildElement: buildElement,
  buildElementWithSpec: buildElementWithSpec,
  validateSpec: Impl.validateSpec,
  validateOptions: Impl.validateOptions
};
