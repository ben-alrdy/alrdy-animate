const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production', // or 'development'
  entry: './src/js/AlrdyAnimate.js',
  output: {
    filename: 'AlrdyAnimate.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      name: 'AlrdyAnimate',
      type: 'umd',
      export: 'AlrdyAnimate',
    },
    globalObject: 'this',
    chunkFilename: 'chunks/[name].js'
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
      filename: 'AlrdyAnimate.css'
    })
  ],
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      cacheGroups: {
        gsapCore: {
          test: /[\\/]node_modules[\\/]gsap[\\/]/,
          name: 'gsap-core',
          chunks: 'async',
          priority: 20,
          enforce: true
        },
        animations: {
          test: /[\\/](gsapBundle|gsapAnimations|textSplitter)[\\/]|[\\/]node_modules[\\/]split-type[\\/]/,
          name: 'gsap-animations',
          chunks: 'async',
          priority: 10,
          enforce: true
        },
        defaultVendors: false
      }
    }
  },
  performance: {
    hints: false
  }
};
