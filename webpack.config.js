const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production', // or 'development'
  entry: './src/js/AlrdyAnimate.js',
  output: {
    filename: 'AlrdyAnimate.js',
    path: path.resolve(__dirname, 'dist'),
    // Add this line for dynamic imports
    chunkFilename: '[name].chunk.js'
  },
  devtool: false, //'source-map' or false in production
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      // Add this rule for JavaScript files
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'AlrdyAnimate.css' // Output CSS file name
    })
  ],
  // Add this optimization configuration
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
