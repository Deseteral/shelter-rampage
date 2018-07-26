const path = require('path');
const MinifyPlugin = require('babel-minify-webpack-plugin');

module.exports = {
  mode: 'none',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'engine.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { chrome: 67 },
              }],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new MinifyPlugin(),
  ],
};
