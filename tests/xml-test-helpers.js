const xpath = require('xpath');

function selectElementNodeById (elementName, id, name, parentNode) {
  let elementResult = xpath.select(`.//${elementName}[@${id}="${name}"]`, parentNode) || {};
  let elementNode = {};

  if (elementResult && elementResult.length > 0) {
    elementNode = elementResult[0];
  }

  return elementNode;
}

function selectFirst (query, documentNode) {
  const selectionResult = xpath.select(query, documentNode) || {};

  if (selectionResult.length && selectionResult.length > 0) {
    const firstNode = selectionResult[0];
    return firstNode;
  }

  return null;
}

module.exports = {
  selectFirst: selectFirst,
  selectElementNodeById: selectElementNodeById
};
