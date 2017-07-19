const path = require('path')
const path_src = path.resolve(__dirname, './src')
const path_dist = path.resolve(__dirname, './build')
const path_style = path.resolve(path_src, './style')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    app: [
      'webpack-dev-server/client?http://localhost:30000/',
      'webpack/hot/dev-server',
      './src/index.ts'
    ]
  },
  output: {
    path: path_dist,
    filename: `app.[hash].js`
  },
  resolve: {
    alias: {
      '~': path_src
    },
    extensions: ['.ts', '.js']
  },
  devtool: '#source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/]
        }
      },
      {
        test: /\.s(a|c)ss$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true, includePaths: [path_style] } }
        ]
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
        loader: 'url-loader',
        options: {
          limit: '10000',
          name: './assets/[name].[ext]'
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            sass: `style-loader!css-loader!sass-loader?includePaths[]=${path_style}`
          },
          esModule: true
        }
      }
    ]
  },
  plugins: [
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    // }),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      inject: 'body'
    })
  ]
}
