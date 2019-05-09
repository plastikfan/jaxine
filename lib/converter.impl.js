
const xpath = require('xpath');
const R = require('ramda');

/**
 * @function buildElement
 * @description: builds the native object representing an element, and recurses in 2 dimensions;
 *    by the "recurse" attribute (usually "inherits") and via the element's direct descendants.
 *
 * @param {XMLNode} elementNode: the XML node which is to be built.
 * @param {XMLNode} parentNode: the XML node which is the immediate parent of the element.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @param {Object} spec: Describes structure of the built JSON object.
 * @param {String[]} [previouslySeen=[]]: Used internally to guard against circular references.
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
function buildElement (elementNode, parentNode, getOptions, spec, previouslySeen = []) {
  let element = buildLocalAttributes(elementNode);
  element[spec.labels.element] = elementNode.nodeName;

  const { recurse = '', discards = [] } = getOptions(elementNode.nodeName);

  if (recurse !== '') {
    element = recurseThroughAttribute(element, elementNode, parentNode, getOptions,
      spec, previouslySeen);
  }

  // Finally, filter out attributes we don't need on the final built native element
  //
  R.forEach(at => {
    element = R.dissoc(at, element);
  }, discards);

  if (elementNode.hasChildNodes()) {
    element = buildChildren(element, elementNode, getOptions, spec, previouslySeen);
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
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @param {Object} spec: Describes structure of the built JSON object.
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
function recurseThroughAttribute (element, elementNode, parentNode, getOptions, spec, previouslySeen) {
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
          return buildElement(inheritedElementNode, parentNode, getOptions,
            spec, previouslySeen);
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
        let inheritedElement = buildElement(inheritedElementNode, parentNode, getOptions,
          spec, previouslySeen);

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
 * @param {XMLNode} localNode: The XML node being built
 * @returns an object containing all the attributes found. eg:
 *{
   "name": "uni-command",
   "abstract": "true"
 }
 */
function buildLocalAttributes (localNode) {
  // First collect all the attributes (@*) -> create attribute nodes
  // node.nodeType = 2 (ATTRIBUTE_NODE). By implication of the xpath query
  // (ie, we're selecting all attributes) all the nodeTypes of the nodes
  // returned should all be = 2; we could check with a ramda call, but is this
  // necessary?
  //
  const attributeNodes = xpath.select('@*', localNode) || [];

  // Attribute nodes have name and value properties on them
  //
  const nvpair = R.props(['name', 'value']);
  let element = R.fromPairs(R.map(nvpair, attributeNodes));

  return element;
}

/**
 * @function: buildChildren
 *
 * @param {Object} element: The native object being built that represents "elementNode"
 * @param {XMLNode} elementNode: The XML node being built
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @param {Object} spec: Describes structure of the built JSON object.
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
function buildChildren (element, elementNode, getOptions, spec, previouslySeen) {
  let selectionResult = xpath.select('./*', elementNode);

  if (selectionResult && selectionResult.length > 0) {
    let getElementsFn = R.filter((child) => (child.nodeType === child.ELEMENT_NODE));
    let elements = getElementsFn(selectionResult);

    let children = R.reduce((acc, childElement) => {
      let child = buildElement(childElement, elementNode, getOptions, spec, previouslySeen);
      return R.append(child, acc);
    }, [])(elements);

    if (R.includes(spec.labels.descendants, R.keys(element))) {
      let merged = R.concat(children, element[spec.labels.descendants]);
      element[spec.labels.descendants] = merged;
    } else {
      element[spec.labels.descendants] = children;
    }

    if (R.hasPath(['descendants', 'by'], spec)) {
      const descendants = element[spec.labels.descendants];

      if (R.all(R.has(spec.descendants.attribute))(children)) {
        if (R.pathEq(['descendants', 'by'], 'index', spec)) {
          if (spec.descendants.throwIfCollision) {
            // We need a new version of Ramda's indexBy function that can take an extra
            // parameter being a function which is invoked to handle duplicate keys. In
            // its absence, we can find duplicates via a reduce ...
            //
            R.reduce((acc, val) => {
              if (R.contains(val[spec.descendants.attribute], acc)) {
                throw new Error(`Element collision found: ${JSON.stringify(val)}`);
              }
              return R.append(val[spec.descendants.attribute], acc);
            }, [])(descendants);
          }

          element[spec.labels.descendants] = R.indexBy(R.prop(spec.descendants.attribute),
            descendants);
        } else if (R.pathEq(['descendants', 'by'], 'group', spec)) {
          element[spec.labels.descendants] = R.groupBy(R.prop(spec.descendants.attribute),
            descendants);
        }
      } else if (spec.descendants.throwIfMissing) {
        const missing = R.find(R.not(R.has(spec.descendants.attribute)))(children) || {};
        throw new Error(
          `Element is missing key attribute "${spec.descendants.attribute}": (${JSON.stringify(missing)})`);
      }
    }
  }

  let text = composeText(elementNode, spec);

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
 * @param {XMLNode} elementNode: The XML node being built
 * @param {Object} spec: Describes structure of the built JSON object.
 * @returns {String} The text collected from the immediate children of the elementNode being
 *    built.
 */
function composeText (elementNode, spec) {
  let text = '';
  let currentChild = elementNode.firstChild;
  const doTrim = R.has('trim')(spec) ? R.prop('trim')(spec) : true;
  while (currentChild !== null) {
    if (currentChild.data && currentChild.data !== null) {
      text = doTrim ? R.concat(text, currentChild.data.trim()) : R.concat(text, currentChild.data);
    }
    currentChild = currentChild.nextSibling;
  }

  return text;
}

/**
 * @function: validateSpec
 * @description: Ensures that spec object is valid, throws if not.
 *
 * @param {Object} spec: Spec object to be validated
 * Returns true if valid.
 */
function validateSpec (spec) {
  const throwIfPropNotIn = (propName, propValues, container) => {
    const val = R.prop(propName)(container);
    if (!R.includes(val, propValues)) {
      throw new Error(`"${propName}" not valid, must be in: "${propValues}", spec: ${JSON.stringify(spec)}`);
    }
  };

  const throwIfMissing = (labelName, from, container) => {
    if (!R.has(labelName)(container)) {
      throw new Error(`"${labelName}" property missing from ${from}, spec: ${JSON.stringify(spec)}`);
    }
  };
  const labels = R.prop('labels')(spec);

  [
    { labelName: 'attributesType', from: 'spec', container: spec },
    { labelName: 'labels', from: 'spec', container: spec },
    { labelName: 'element', from: 'spec.labels', container: labels },
    { labelName: 'descendants', from: 'spec.labels', container: labels },
    { labelName: 'text', from: 'spec.labels', container: labels }
  ].forEach((o) => {
    throwIfMissing(o.labelName, o.from, o.container);
  });

  throwIfPropNotIn('attributesType', ['Member', 'Array'], spec);

  if (R.propEq('attributesType', 'Array', spec)) {
    throwIfMissing('attribute', 'spec', labels);
  }

  if (R.has('descendants', spec)) {
    const descendants = R.prop('descendants')(spec);
    throwIfPropNotIn('by', ['group', 'index'], descendants);
    throwIfMissing('attribute', 'descendants', descendants);

    if (R.has('throwIfCollision')(descendants)) {
      if (R.propEq('by', 'group')(descendants)) {
        throw new Error(`Can't specify by="group" and throwIfCollision="true", spec: ${JSON.stringify(spec)}`);
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
  buildElement: buildElement,
  selectElementNodeById: selectElementNodeById,
  buildLocalAttributes: buildLocalAttributes,
  buildChildren: buildChildren,
  composeText: composeText,
  validateSpec: validateSpec
};