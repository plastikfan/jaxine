
function logIfFailed (result, widget) {
  if (!result) {
    console.log(`FAILURE!: ${widget}!`);
  }

  return result;
}

function logIfFailedStringify (result, widget) {
  if (!result) {
    console.log(`FAILURE!: ${JSON.stringify(widget)}`);
  }

  return result;
}

module.exports = {
  logIfFailed: logIfFailed,
  logIfFailedStringify: logIfFailedStringify
};
