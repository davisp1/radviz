const webpack = require("webpack");
const path = require("path");

let config = {
    entry: "./index.js",
    output: {
      path: path.resolve(__dirname, "./public"),
      filename: "./bundle.js"
    },
    module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "babel-loader"
        }]
    },
    devServer: {
      contentBase: path.resolve(__dirname, "./public"),
      historyApiFallback: true,
      inline: true,
      open: true,
      hot: true
    },
    devtool: "eval-source-map"
}

module.exports = config;