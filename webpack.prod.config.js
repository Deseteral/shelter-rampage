const path = require('path');

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
                targets: { chrome: 68 },
              }],
              'minify',
            ],
            plugins: ['@babel/plugin-syntax-object-rest-spread'],
          },
        },
      },
    ],
  },
};
