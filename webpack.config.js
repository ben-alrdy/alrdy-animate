const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development', // or 'production' or 'none'
  entry: './src/js/AlrdyAnimate.js',
  output: {
    filename: 'AlrdyAnimate.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: 'source-map', // Use 'source-map' for better debugging in development
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