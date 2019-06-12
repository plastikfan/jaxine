
const xpath = require('xpath');
const R = require('ramda');
const { functify } = require('jinxed');
const moment = require('moment');

const fullSpecWithDefaults = Object.freeze({
  name: 'full-spec-with-defaults',
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
          open: '!<[]>[',
          close: ']',
          payload: {
            delim: '=',
            valuetype: 'primitive'
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
      fallback: true // if option not found under textNodes, then look in attributes
    }
  }
});

/**
 * @function buildElementWithSpec
 * @description: builds the native object representing an element, and recurses in 2 dimensions;
 *    by the "recurse" attribute (usually "inherits") and via the element's direct descendants.
 *    (See converter.buildElementWithSpec)
 *
 */
function buildElementWithSpec (elementNode, parentNode, spec, getOptions, previouslySeen = []) {
  let element = buildLocalAttributes(spec, elementNode);
  element[spec.labels.element] = elementNode.nodeName;

  const { recurse = '', discards = [] } = getOptions(elementNode.nodeName);

  if (recurse !== '') {
    element = recurseThroughAttribute(element, elementNode, parentNode, spec,
      getOptions, previouslySeen);
  }

  // Finally, filter out attributes we don't need on the final built native element
  //
  R.forEach(at => {
    element = R.dissoc(at, element);
  }, discards);

  if (elementNode.hasChildNodes()) {
    element = buildChildren(element, elementNode, spec, getOptions, previouslySeen);
  }

  return element;
}

/**
 * @function recurseThroughAttribute
 * @description: This function is designed to be called for those elements that are able to
 *    have a relationship with another XML element of the same type such that they can be merged
 *    into the same instance based upon a common attribute defined by @recurse (usually "inherits").
 *    Inheritance can be vertical or horizontal. Vertical means that an element inherits from
 *    another one and that one also inherits, creating a single chain. Horizontal represents
 *    multiple inheritance/parents each of which may or may not inherit, in effect creating
 *    multiple chains.
 *      Precedence rules: for vertical, the most derived element takes precedence, so any attribute
 *    that appears in both will take its value from the most derived instance. For horizontal,
 *    the attribute that appears in the right most elements inheritance definition takes precedence.
 *
 * @param {Object} element: the native object built that represents an XMLNode.
 * @param {XMLNode} elementNode: the XML node which is to be built.
 * @param {XMLNode} parentNode: the XML node which is the immediate parent of the element.
 * @param {Object} spec: Describes structure of the built JSON object.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @param {String[]} [previouslySeen=[]]: Used internally to guard against circular references.
 * @returns {Object} an object in generic format eg:
 *{
   'name': 'duo-command',
   '_': 'Command',
   '_children': [{
     '_': 'Arguments',
     '_children': [{
       'name': 'path',
       '_': 'ArgumentRef'
     }, {
       'name': 'filesys',
       '_': 'ArgumentRef'
     }, {
       'name': 'tree',
       '_': 'ArgumentRef'
     }]
   }],
   'abstract': 'true',
   'inherits': 'uni-command'
 }
 */
function recurseThroughAttribute (element, elementNode, parentNode, spec, getOptions, previouslySeen) {
  const options = getOptions(elementNode.nodeName);

  const { id, recurse = '' } = options;
  const identifier = element[id] || '';

  if (identifier === '') {
    return element;
  }

  if (recurse !== '') {
    if (R.includes(identifier, previouslySeen)) {
      throw new Error(`Circular reference detected, element '${identifier}', has already been encountered.`);
    } else {
      previouslySeen = R.append(identifier, previouslySeen);
    }
    const { nodeName } = elementNode;

    // First get the recurse element(s), which is a csv inside @inherits.
    //
    const recurseAttr = elementNode.getAttribute(recurse) || '';

    // No attempt needs to be made to correctly merge inheritance chains, because the
    // inheritance chain is stripped off at the end anyway, since the concrete element
    // will have no use for it.
    //
    if (recurseAttr !== '') {
      // This is where horizontal merging occurs. IE, if this element inherits
      // from multiple commands (eg @inherits="base-command,domain-command,uni-command").
      // Usually, we'd expect that commands that are being merged horizontally, will not
      // contain clashes in properties, but that doesn't mean it can't occur. Also
      // this is where vertical merging could be required.
      //
      const recurseAttributes = R.split(',', recurseAttr);

      if (recurseAttributes.length > 1) {
        // Just need to map the at to a built element => array which we pass to merge
        //
        let inheritedElements = R.map(at => {
          // select element bode by id
          //
          let inheritedElementNode = selectElementNodeById(nodeName, id, at, parentNode);

          // Horizontal recursion/merging eg: (at => base-command|domain-command|uni-command)
          //
          return buildElementWithSpec(inheritedElementNode, parentNode, spec, getOptions,
            previouslySeen);
        }, recurseAttributes);

        // Now merge one by one. On the first iteration a={} and b=first-element. This means
        // we are merging as expected, with b taking precedence over a. So the last item
        // in the list takes precedence.
        //
        let doMergeElements = (a, b) => {
          let merged;

          if (R.includes(spec.labels.descendants, R.keys(a)) && R.includes(spec.labels.descendants, R.keys(b))) {
            // Both a and b have children, therefore we must merge in such a way as to
            // not to lose any properties of a by calling R.mergeAll
            //
            let mergedChildren = R.concat(a[spec.labels.descendants], b[spec.labels.descendants]); // save a
            let allMergedWithoutChildrenOfA = R.mergeAll([a, b]); // This is where we lose the children of a

            // Restore the lost properties of a
            //
            const childrenLens = R.lensProp(spec.labels.descendants);
            merged = R.set(childrenLens, mergedChildren, allMergedWithoutChildrenOfA);
          } else {
            // There is no clash between the children of a or b, therefore we can
            // use R.mergeAll safely.
            //
            merged = R.mergeAll([a, b]);
          }

          return merged;
        };

        let mergedInheritedElements = R.reduce(doMergeElements, {}, inheritedElements);

        // Now combine with this element
        //
        let mergeList = [mergedInheritedElements, element];

        // NB: This mergeAll is safe here, because we haven't yet built the children of this
        // element yet; this will happen later and is resolved in buildChildren.
        //
        element = R.mergeAll(mergeList);
      } else {
        // Now build the singular inherited element
        //
        const inheritedElementName = recurseAttributes[0];
        const inheritedElementNode = selectElementNodeById(nodeName, id, inheritedElementName, parentNode);

        // Vertical recursion/merging to the base element
        //
        let inheritedElement = buildElementWithSpec(inheritedElementNode, parentNode, spec, getOptions,
          previouslySeen);

        // Now we need to perform a merge of this element with the inherited element
        // ensuring that any properties in this element take precedence.
        //
        let mergeList = [inheritedElement, element];
        element = R.mergeAll(mergeList);
      }
    } // else recursion ends
  }

  return element;
}

/**
 * @function selectElementNodeById
 * @description This should only be used when the expect number of nodes returned is 1,
 *    since element names are supposed to be unique.
 *
 * @param {String} elementName: The XML element name.
 * @param {String} id: The name of the attribute used to identify the element
 * @param {String} name: The value of the "id" attribute.
 * @param {XMLNode} parentNode: The XML/XPath node which provides the context for the xpath
 *    expression.
 * @returns {XMLNode}: The single node that represents the element identified. Returns
 *    {} if not found.
 */
function selectElementNodeById (elementName, id, name, parentNode) {
  let elementResult = xpath.select(`.//${elementName}[@${id}="${name}"]`, parentNode) || {};
  let elementNode = {};

  if (elementResult && elementResult.length > 0) {
    elementNode = elementResult[0];
  }

  return elementNode;
}

/**
 * @function: buildLocalAttributes
 * @description: Selects all the attributes from the "localNode"
 *
 * @param {Object} spec: Describes structure of the built JSON object.
 * @param {XMLNode} localNode: The XML node being built
 * @returns an object containing all the attributes found. eg:
 *{
   "name": "uni-command",
   "abstract": "true"
 }
 */
function buildLocalAttributes (spec, localNode) {
  // First collect all the attributes (@*) -> create attribute nodes
  // node.nodeType = 2 (ATTRIBUTE_NODE). By implication of the xpath query
  // (ie, we're selecting all attributes) all the nodeTypes of the nodes
  // returned should all be = 2; we could check with a ramda call, but is this
  // necessary?
  //
  const attributeNodes = xpath.select('@*', localNode) || [];
  let element = {};

  if (R.hasPath(['labels', 'attributes'])(spec)) {
    // Build attributes as an array identified by labels.attributes
    //
    element[spec.labels.attributes] = R.reduce((acc, attrNode) => {
      const rawAttributeValue = attrNode['value'];
      return R.append(R.objOf(attrNode['name'], rawAttributeValue), acc);
    }, [])(attributeNodes);
  } else {
    // Build attributes as members.
    // Attribute nodes have name and value properties on them
    //
    let nvpair = R.props(['name', 'value']); // => [attrKey, attrValue]
    const coercedPair = (n) => {
      let pr = nvpair(n);
      const attributeName = R.head(pr);
      const rawAttributeValue = R.last(pr);
      const matchers = fetchCoercionOption('coercion/attributes/matchers', spec);
      const coercedValue = coerceAttributeValue(spec, matchers, rawAttributeValue, attributeName);
      pr[1] = coercedValue;
      return pr;
    };

    element = R.fromPairs(R.map(coercedPair, attributeNodes));
  }

  return element;
}

function getMatcher (name) {
  if (!getMatcher.matcherFns) {
    getMatcher.matcherFns = {
      'number': transformNumber,
      'boolean': transformBoolean,
      'primitives': transformPrimitives,
      'collection': transformCollection,
      'date': transformDate,
      'symbol': transformSymbol,
      'string': transformString
    };
  }

  return getMatcher.matcherFns[name];
}

/**
 *
 *
 * @param {*} spec
 * @param {*} attributeName
 * @param {*} rawValue
 * @returns
 */
function coerceAttributeValue (spec, matchers, rawValue, attributeName) {
  let resultValue = rawValue;

  if (R.is(Object)(matchers)) {
    // insertion order of keys is preserved, because key types of symbol
    // and string are iterated in insertion order. Iterative only whilst
    // we don't have a successful coercion result.
    //
    R.keys(matchers).some((m) => {
      const matchFn = getMatcher(R.toLower(m));
      const result = matchFn.call(this, rawValue, 'attribute', spec);

      if (result.succeeded) {
        resultValue = result.value;
      }
      return result.succeeded;
    });
  } else {
    if (R.is(Object)(matchers)) {
      throw new Error(`coerceAttributeValue: Internal error, invalid matchers: ${functify(matchers)}, for attribute: ${attributeName} / raw value: ${rawValue}`);
    }
  }
  return resultValue;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
//
function escapeRegExp (inputString) {
  return inputString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function transformNumber (numberValue, context, spec) {
  let result = Number(numberValue);
  const succeeded = !(isNaN(result));
  if (!isNaN(result)) {
    result = numberValue;
  }

  return {
    value: result,
    succeeded: succeeded
  };
}

function transformBoolean (booleanValue, context, spec) {
  let value = booleanValue;
  let succeeded = false;

  if (R.is(Boolean)(booleanValue)) {
    succeeded = true;
    value = booleanValue;
  } else if (R.is(String)(booleanValue)) {
    const lowerBooleanValue = R.toLower(booleanValue);
    if (R.either(R.equals('true'), R.equals('false'))(lowerBooleanValue)) {
      succeeded = true;
      value = true;

      if (R.equals('false')(lowerBooleanValue)) {
        value = false;
      }
    }
  }

  return {
    value: value,
    succeeded: succeeded
  };
}

function transformPrimitives (primitiveValue, context, spec) {
  const primitives = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.primitives)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'primitives']))(spec)
  );

  let coercedValue = null;
  let succeeded;

  primitives.some((p) => {
    const mfn = getMatcher(p);
    const coercedResult = mfn(primitiveValue, context, spec);
    succeeded = coercedResult.succeeded;

    if (succeeded) {
      coercedValue = coercedResult.value;
    }
  });

  return {
    succeeded: succeeded,
    value: coercedValue
  };
}

function transformDate (dateValue, context, spec) {
  const format = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.date.format)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'date', 'format']))(spec)
  );

  let momentDate;
  let succeeded;

  try {
    momentDate = moment(dateValue, format);
    succeeded = momentDate.isValid();
  } catch (err) {
    succeeded = false;
    momentDate = dateValue;
  }

  return {
    value: momentDate,
    succeeded: succeeded
  };
}

// There must be a better way to do this (like Object.create), not found the complete
// answer yet, so this is a stopgap.
//
// Creating TypeArray from existing iterable ([])
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/from
//
const createTypedCollection = (arrayElements) => R.cond([
  [R.equals('int8array'), R.always(Int8Array.from(arrayElements))],
  [R.equals('uint8array'), R.always(Uint8Array.from(arrayElements))],
  [R.equals('uint8clampedarray'), R.always(Uint8ClampedArray.from(arrayElements))],
  [R.equals('int16array'), R.always(Int16Array.from(arrayElements))],
  [R.equals('uint16array'), R.always(Uint16Array.from(arrayElements))],
  [R.equals('int32array'), R.always(Int32Array.from(arrayElements))],
  [R.equals('uint32array'), R.always(Uint32Array.from(arrayElements))],
  [R.equals('float32array'), R.always(Float32Array.from(arrayElements))],
  [R.equals('float64array'), R.always(Float64Array.from(arrayElements))],
  [R.equals('set'), R.always(new Set(arrayElements))],
  [R.equals('weakset'), R.always(new WeakSet(arrayElements))],
  [R.equals('map'), R.always(new Map(arrayElements))],
  [R.equals('weakmap'), R.always(new WeakMap(arrayElements))]
]);

/**
 *
 *
 * @param {*} collectionValue
 * @param {*} spec
 * @returns
 */
function transformCollection (collectionValue, context, spec) {
  let succeeded = true;
  let value = null;

  if (succeeded) {
    // TEMPORARY BYPASS, JUST RETURN THE ORIGINAL VALUE
    return {
      value: collectionValue,
      succeeded: succeeded
    };
  }

  const delim = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.collection.delim)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'collection', 'delim']))(spec)
  );
  const arrayElements = collectionValue.split(delim);

  const open = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.collection.open)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'collection', 'open']))(spec)
  );
  const openExpr = new RegExp('^' + open);

  const close = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.collection.close)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'collection', 'close']))(spec)
  );
  const closeExpr = new RegExp(close + '$');

  if (openExpr.test(collectionValue) && closeExpr.test(collectionValue)) {
    // Now look for the collection type which should be captured as '<type>'
    //
    const typeRegExp = new RegExp(escapeRegExp('(?<type>[w<>])'));
    if (typeRegExp.test(collectionValue)) {
      let result = typeRegExp.exec(collectionValue);
      const arrayType = result.groups.type;

      if (arrayType === '[]') {
        // map/transformPrimitive?
        //
        value = arrayElements;
      } else {
        try {
          value = createTypedCollection(arrayElements)(R.toLower(arrayType));
        } catch (err) {
          value = arrayElements;
          succeeded = false;
        }
      }
    }
  } else {
    value = arrayElements;
    succeeded = false;
  }

  return {
    value: value,
    succeeded: succeeded
  };
}

function transformSymbol (symbolValue, context, spec) {
  const prefix = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.symbol.prefix)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'symbol', 'prefix']))(spec)
  );

  const global = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.symbol.global)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'symbol', 'global']))(spec)
  );

  let expr = new RegExp('^' + escapeRegExp(prefix));

  let succeeded = expr.test(symbolValue);

  return {
    value: global ? Symbol.for(symbolValue) : Symbol(symbolValue),
    succeeded: succeeded
  };
}

function transformString (stringValue, context, spec) {
  const stringCoercionAcceptable = R.defaultTo(fullSpecWithDefaults.coercion.attributes.matchers.string)(
    R.view(R.lensPath(['coercion', context, 'matchers', 'string']))(spec)
  );

  if (!stringCoercionAcceptable) {
    throw new Error(`matching failed, terminated by string matcher.`);
  }

  return {
    value: stringValue,
    succeeded: true
  };
}

/**
 * @function: buildChildren
 *
 * @param {Object} element: The native object being built that represents "elementNode"
 * @param {XMLNode} elementNode: The XML node being built
 * @param {Object} spec: Describes structure of the built JSON object.
 * @param {callback(el:string)} getOptions: (See converter.buildElementWithSpec)
 * @param {String[]} [previouslySeen=[]]: Used internally to guard against circular references.
 * @returns {Object} an object in generic format eg:
 *{
   'name': 'base-command',
   'source': 'filesystem-source',
   '_': 'Command',
   '_children': [{
     '_': 'Arguments',
     '_children': [{
       'name': 'loglevel',
       '_': 'ArgumentRef'
     }, {
       'name': 'logfile',
       '_': 'ArgumentRef'
     }]
   }]
 }
 */
function buildChildren (element, elementNode, spec, getOptions, previouslySeen) {
  let selectionResult = xpath.select('./*', elementNode);

  if (selectionResult && selectionResult.length > 0) {
    let getElementsFn = R.filter((child) => (child.nodeType === child.ELEMENT_NODE));
    let elements = getElementsFn(selectionResult);

    let children = R.reduce((acc, childElement) => {
      let child = buildElementWithSpec(childElement, elementNode, spec, getOptions, previouslySeen);
      return R.append(child, acc);
    }, [])(elements);

    if (R.includes(spec.labels.descendants, R.keys(element))) {
      let merged = R.concat(children, element[spec.labels.descendants]);
      element[spec.labels.descendants] = merged;
    } else {
      element[spec.labels.descendants] = children;
    }

    const options = getOptions(element[spec.labels.element]);

    if (R.hasPath(['descendants', 'by'], options)) {
      const descendants = element[spec.labels.descendants];

      if (R.all(R.has(options.id))(children)) {
        if (R.pathEq(['descendants', 'by'], 'index', options)) {
          if (options.descendants.throwIfCollision) {
            // We need a new version of Ramda's indexBy function that can take an extra
            // parameter being a function which is invoked to handle duplicate keys. In
            // its absence, we can find duplicates via a reduce ...
            //
            R.reduce((acc, val) => {
              if (R.contains(val[options.id], acc)) {
                throw new Error(`Element collision found: ${functify(val)}`);
              }
              return R.append(val[options.id], acc);
            }, [])(descendants);
          }

          element[spec.labels.descendants] = R.indexBy(R.prop(options.id),
            descendants);
        } else if (R.pathEq(['descendants', 'by'], 'group', options)) {
          element[spec.labels.descendants] = R.groupBy(R.prop(options.id),
            descendants);
        }
      } else if (options.descendants.throwIfMissing) {
        const missing = R.find(R.not(R.has(options.id)))(children) || {};
        throw new Error(
          `Element is missing key attribute "${options.id}": (${functify(missing)})`);
      }
    }
  }

  let text = composeText(spec, elementNode);

  if (text && text !== '') {
    element[spec.labels.text] = text;
  }

  return element;
}

/**
 * @function: composeText
 * @description: The text of an XML element can be accessed only by using .firstChild and
 *    .nextSibling. Both raw text (appearing inside the opening and closing element tags)
 *    and CDATA text are supported. Unfortunately, comment text is also read in. Comment
 *    text is not going to cause problems, because the comment text doesn't appear in any
 *    location. Every element has the potential to have text on it so it has to be invoked
 *    for every element processed. NB: It is not possible to select all the Text nodes from an
 *    element based upon the nodeType.
 *
 * @param {Object} spec: Describes structure of the built JSON object.
 * @param {XMLNode} elementNode: The XML node being built
 * @returns {String} The text collected from the immediate children of the elementNode being
 *    built.
 */
function composeText (spec, elementNode) {
  let text = '';
  let currentChild = elementNode.firstChild;
  const doTrim = fetchCoercionOption('coercion/textNodes/trim', spec);

  while (currentChild !== null) {
    if (currentChild.data && currentChild.data !== null) {
      text = doTrim ? R.concat(text, currentChild.data.trim()) : R.concat(text, currentChild.data);
    }
    currentChild = currentChild.nextSibling;
  }

  return text;
}

const missing = x => x === undefined;
const optional = fn => R.either(missing, fn);

/**
 *
 *
 * @param {*} itemLens
 * @param {*} source
 * @returns
 */
function viewItem (itemLens, source) {
  return R.view(itemLens)(source);
}

// function toBoolean (value) {
//   if (R.equals('true')(R.toLower(value))) {
//     return true;
//   } else if (R.equals('false')(R.toLower(value))) {
//     return false;
//   }

//   return value;
// }

/**
 * @function: fetchCoercionOption
 * @description: Fetches the option denoted by the path. If the option requested does
 *    not appear in spec the provided, the option will be fetched from the default
 *    spec. The path specified must be treated as absolute and relates to the base
 *    spec.
 *
 * @param {*} spec: must be the base spec
 */
function fetchCoercionOption (path, spec) {
  // we need to take "path" as a string because the path's segments are not retrievable
  // from a lens. We need access to a segment(the last one) after lens is created,
  // so we take a path and build a lens from it.
  //
  const contextSegmentNo = 1;
  const segments = R.split('/')(path);
  const itemLens = R.lensPath(segments);
  const leafSegment = R.last(segments);
  const context = segments[contextSegmentNo];
  let defaultLens = itemLens;

  if (context === 'textNodes') {
    if (R.includes(leafSegment, ['delim', 'open', 'close'])) {
      throw new Error(`Internal error, leaf property(last), should not be defined under "textNodes": (${path})`);
    }

    // The default lens points to attributes
    //
    defaultLens = R.lensPath(R.update(contextSegmentNo, 'attributes')(segments));
  }

  return R.defaultTo(viewItem(defaultLens, fullSpecWithDefaults))(viewItem(itemLens, spec));
}

/**
 * @function: validateSpec
 * @description: Ensures that spec object is valid, throws if not.
 *
 * @param {Object} spec: Spec object to be validated
 * Returns true if valid.
 */
function validateSpec (spec) {
  const throwIfMissing = (labelName, from, container) => {
    if (!R.has(labelName)(container)) {
      throw new Error(`"${labelName}" property missing from ${from}, spec: ${functify(spec)}`);
    }
  };
  const labels = R.prop('labels')(spec);

  [
    { labelName: 'labels', from: 'spec', container: spec },
    { labelName: 'element', from: 'spec.labels', container: labels },
    { labelName: 'descendants', from: 'spec.labels', container: labels },
    { labelName: 'text', from: 'spec.labels', container: labels }
  ].forEach((o) => {
    throwIfMissing(o.labelName, o.from, o.container);
  });

  // coercion validation
  //
  const coercion = viewItem(R.lensProp('coercion'), spec);

  if (coercion) {
    const attributes = viewItem(R.lensProp('attributes'), coercion);

    if (attributes) {
      // Validate attributes.trim
      //
      if (R.not(R.where({
        trim: optional(R.is(Boolean))
      })(attributes))) {
        throw new Error(`Invalid payload found: ${functify(attributes)}`);
      }

      // Validate attributes.matchers.primitives
      //
      R.forEach((p) => {
        if (R.not(R.includes(R.toLower(p), ['number', 'boolean', 'primitive']))) {
          throw new Error(`Invalid primitive value found: "${p}"`);
        }
      })(viewItem(R.lensPath(['matchers', 'primitives']), attributes) || []);

      // Validate attributes.matchers.collection
      //
      const matchers = viewItem(R.lensProp('matchers'), attributes);
      validateMatchers('attributes', matchers);
    } // attributes

    // Validate textNodes
    //
    const textNodes = viewItem(R.lensProp('textNodes'), coercion);

    if (textNodes) {
      // Validate textNodes.trim
      //
      if (R.not(R.where({
        trim: optional(R.is(Boolean))
      })(textNodes))) {
        throw new Error(`Invalid textNodes.trim found: ${functify(textNodes)}`);
      }

      // Validate textNodes.fallback
      //
      if (R.not(R.where({
        fallback: optional(R.is(Boolean))
      })(textNodes))) {
        throw new Error(`Invalid textNodes.fallback found: ${functify(textNodes)}`);
      }

      // Validate textNodes.matchers.collection
      //
      const matchers = viewItem(R.lensProp('matchers'), textNodes);
      validateMatchers('textNodes', matchers);
    } // textNode
  }

  return true;
}

/**
 * @function: validateMatchers
 * @description:
 *
 * @param {string} context ("attributes" | "textNodes")
 * @param {Object} matchers
 */
function validateMatchers (context, matchers) {
  if (matchers) {
    const collectionMatcher = viewItem(R.lensProp('collection'), matchers);

    if (collectionMatcher) {
      if (context === 'attributes') {
        if (R.not(R.where({
          delim: optional(R.is(String)),
          open: optional(R.is(String)),
          close: optional(R.is(String)),
          payload: optional(R.is(Object))
        })(collectionMatcher))) {
          throw new Error(`Invalid collection matcher found: ${functify(collectionMatcher)}`);
        }
      } else if (context === 'textNodes') {
        if (R.not(R.where({
          payload: optional(R.is(Object))
        })(collectionMatcher))) {
          throw new Error(`Invalid collection matcher found: ${functify(collectionMatcher)}`);
        }

        if (R.has('delim')(collectionMatcher)) {
          throw new Error(`Can't define "delim" for ${context}, ${functify(collectionMatcher)}`);
        }

        if (R.has('open')(collectionMatcher)) {
          throw new Error(`Can't define "open" for ${context}, ${functify(collectionMatcher)}`);
        }

        if (R.has('close')(collectionMatcher)) {
          throw new Error(`Can't define "close" for ${context}, ${functify(collectionMatcher)}`);
        }
      }
    }

    // Validate attributes.matchers.collection.payload
    //
    const payload = viewItem(R.lensProp('payload'), collectionMatcher);

    if (payload) {
      if (R.not(R.where({
        delim: optional(R.is(String)),
        valuetype: optional(R.is(String))
      })(payload))) {
        throw new Error(`Invalid payload found: ${functify(payload)}`);
      }
    }

    // Validate attributes.matchers.date
    //
    const dateMatcher = viewItem(R.lensProp('date'), matchers);

    if (dateMatcher) {
      if (R.not(R.where({
        format: optional(R.is(String))
      })(dateMatcher))) {
        throw new Error(`Invalid format found: ${functify(dateMatcher)}`);
      }
    }

    // Validate attributes.matchers.collection.symbol
    //
    const symbolMatcher = viewItem(R.lensProp('symbol'), matchers);

    if (symbolMatcher) {
      if (R.not(R.where({
        prefix: optional(R.is(String)),
        global: optional(R.is(Boolean))
      })(symbolMatcher))) {
        throw new Error(`Invalid symbol found: ${functify(symbolMatcher)}`);
      }
    }

    // Validate matcher order (string if present must be last)
    //
    if (R.has('string')(matchers)) {
      const last = R.toLower(R.last(Object.getOwnPropertyNames(matchers)));
      if (last !== 'string') {
        throw new Error(`"string" can't be defined as the last matcher`);
      }
    }
  }
}

/**
 * @function: validateOptions
 * @description: Ensures that options object is valid, throws if not.
 *
 * @param {Object} options: Option object to be validated
 * Returns true if valid.
 */
function validateOptions (options) {
  if (R.has('descendants', options)) {
    const throwIfPropNotIn = (propName, propValues, container) => {
      const val = R.prop(propName)(container);
      if (!R.includes(val, propValues)) {
        throw new Error(`"${propName}" not valid, must be in: "${propValues}", spec: ${functify(options)}`);
      }
    };

    const throwIfMissing = (labelName, from, container) => {
      if (!R.has(labelName)(container)) {
        throw new Error(`"${labelName}" property missing from ${from}, spec: ${functify(options)}`);
      }
    };

    const descendants = R.prop('descendants')(options);
    throwIfPropNotIn('by', ['group', 'index'], descendants);
    throwIfMissing('attribute', 'descendants', descendants);

    if (R.has('throwIfCollision')(descendants)) {
      if (R.propEq('by', 'group')(descendants)) {
        throw new Error(`Can't specify by="group" and throwIfCollision="true", spec: ${functify(options)}`);
      }
      throwIfPropNotIn('throwIfCollision', ['true', 'false', true, false], descendants);
    }

    if (R.has('throwIfMissing')(descendants)) {
      throwIfPropNotIn('throwIfMissing', ['true', 'false', true, false], descendants);
    }
  }

  return true;
}

module.exports = {
  fullSpecWithDefaults: fullSpecWithDefaults,
  fetchCoercionOption: fetchCoercionOption,
  buildElementWithSpec: buildElementWithSpec,
  selectElementNodeById: selectElementNodeById,
  buildLocalAttributes: buildLocalAttributes,
  getMatcher: getMatcher,
  buildChildren: buildChildren,
  composeText: composeText,
  validateSpec: validateSpec,
  validateOptions: validateOptions
};
