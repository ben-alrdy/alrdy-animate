const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production', // or 'development'
  entry: './src/js/AlrdyAnimate.js',
  output: {
    filename: 'AlrdyAnimate.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'AlrdyAnimate', // Define the library name
    libraryTarget: 'umd', // Support different module systems
    umdNamedDefine: true
  },
  devtool: false, // Disable source maps 'source-map' for production 
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
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