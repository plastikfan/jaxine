const path = require('path');
const webpack = require('webpack');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const nodeExternals = require('webpack-node-externals');

module.exports = (env) => {
  const {
    ifProduction,
    ifNotTest,
    ifTest
  } = getIfUtils(env);

  const mode = ifProduction('production', 'development');
  console.log('>>> Jaxine Webpack Environment mode: ' + env.mode);

  return {
    mode: mode,
    entry: removeEmpty([
      ifNotTest('./lib/index.js'),
      ifTest('./tests/all-tests-entry.js')
    ]),
    module: {
      rules: [{
        test: /index.js/,
        use: 'shebang-loader'
      }]
    },
    plugins: removeEmpty([
      ifNotTest(new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true
      }))
    ]),
    externals: [nodeExternals()],
    output: removeEmpty(
      ifNotTest({
        filename: 'jaxine-bundle.js',
        path: path.resolve(__dirname, 'dist')
      }),
      ifTest({
        filename: 'jaxine-test-bundle.js',
        path: path.resolve(__dirname, 'dist')
      }))
  };
};
