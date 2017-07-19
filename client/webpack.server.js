const webpack = require('webpack')
const webpackConfig = require('./webpack.config.js')
const compiler = webpack(webpackConfig)

// 启动本地Webpack Dev Server
const WebpackDevServer = require('webpack-dev-server')
const server = new WebpackDevServer(compiler, {
  hot: true,
  // noInfo: true,
  stats: { colors: true },
  contentBase: './build'
})

server.listen(30000, '127.0.0.1', function () {
  console.log(`[Server]Starts on : localhost:30000`)
})
