const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); //https://webpack.js.org/plugins/mini-css-extract-plugin/

module.exports = {
    entry: {
      'script_theme': path.resolve(__dirname, 'scripts/theme.js'),
      'style_theme': path.resolve(__dirname, 'styles/theme.scss'),
      'style_vendor': path.resolve(__dirname, 'styles/vendor.scss'),
    },
    output: {
        path: path.resolve(__dirname, 'assets'),
        filename: '[name].js'
    },
    optimization: {
      minimize: false,
      minimizer: [
        new TerserPlugin({
          test: /\.m?js$/,
          terserOptions: {
            output: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [
        new MiniCssExtractPlugin({
          linkType: 'text/css',
          filename: "[name].css"
        }),
    ],
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            }
          }
        },
        {
          test: /\.scss$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader // creates style nodes from JS strings
            },
            {
              loader: "css-loader" , options: { url: false, importLoaders: 1 }
            },
            {
              loader: "sass-loader"
            }
          ],
        }
      ]
    },
    stats: {
        colors: true
    },
    //devtool: 'source-map'
};