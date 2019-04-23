const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  entry: './tests/all-tests-entry.js',
  externals: [nodeExternals()],
  module: {
    rules: [{
      test: /\.xml$/i,
      use: 'raw-loader'
    }]
  },
  output: {
    filename: 'jaxine-test-bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
