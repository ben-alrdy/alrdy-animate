const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/js/AlrdyAnimate.js',
  output: {
    filename: 'AlrdyAnimate.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'AlrdyAnimate',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'AlrdyAnimate.css' // Output CSS file name
    })
  ]
};