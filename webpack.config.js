// import global vars for a whole app
require('./globals');
const AssetsPlugin = require('assets-webpack-plugin');
const workboxPlugin = require('workbox-webpack-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const {
  BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');
const debug = require('debug')('app:webpack:config');
// ------------------------------------
// RULES INJECTION!
// ------------------------------------
const rules = [
  // PRELOAD CHECKING
  {
    enforce: 'pre',
    test: /\.(js|jsx)?$/,
    exclude: /(node_modules|bower_components)/,
    loader: 'eslint-loader',
    options: {
      quiet: true
    }
  },
  {
    enforce: 'pre',
    test: /\.(ts|tsx)?$/,
    exclude: /(node_modules|bower_components)/,
    loader: 'tslint-loader',
    options: {
      quiet: true,
      tsConfigFile: './tsconfig.json'
    }
  },
  // JAVASCRIPT/JSON
  {
    test: /\.html$/,
    use: {
      loader: 'html-loader'
    }
  },
  {
    test: /\.(js|jsx|ts|tsx)?$/,
    exclude: /(node_modules|bower_components)/,
    loader: 'babel-loader'
  },
  {
    type: 'javascript/auto',
    test: /\.json$/,
    loader: 'json-loader'
  },
  // STYLES
  {
    test: /.scss$/,
    use: [
      __PROD__ ? MiniCssExtractPlugin.loader : 'style-loader',
      {
        loader: 'css-loader',
        options: {
          importLoaders: 2,
          modules: true,
          localIdentName: '[local]___[hash:base64:5]'
        }
      },
      'postcss-loader',
      'sass-loader'
    ]
  },
  // FILE/IMAGES
  {
    test: /\.woff(\?.*)?$/,
    loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/font-woff'
  },
  {
    test: /\.woff2(\?.*)?$/,
    loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/font-woff2'
  },
  {
    test: /\.otf(\?.*)?$/,
    loader: 'file-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=font/opentype'
  },
  {
    test: /\.ttf(\?.*)?$/,
    loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=application/octet-stream'
  },
  {
    test: /\.eot(\?.*)?$/,
    loader: 'file-loader?prefix=fonts/&name=[path][name].[ext]'
  },
  {
    test: /\.svg(\?.*)?$/,
    loader: 'url-loader?prefix=fonts/&name=[path][name].[ext]&limit=10000&mimetype=image/svg+xml'
  },
  {
    test: /\.(jpe?g|png|gif|svg)$/i,
    use: 'file-loader'
  }
];

// ------------------------------------
// BUNDLES OPTIMIZATION
// ------------------------------------
const optimization = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: 2
    },
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          warnings: false,
          compress: {
            unused: true,
            dead_code: true
          }
        },
        sourceMap: true
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  performance: {
    hints: false
  }
};

// ------------------------------------
// STAGE PLUGINS INJECTION! [DEVELOPMENT, PRODUCTION, TESTING]'babel-polyfill', 
// ------------------------------------
const stagePlugins = {
  test: [new BundleAnalyzerPlugin()],
  development: [
    new HtmlWebpackPlugin({
      template: path.resolve('./src/index.html'),
      filename: 'index.html',
      inject: 'body',
      minify: false,
      chunksSortMode: 'auto'
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  production: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[name].[hash].css'
    }),
    new HtmlWebpackPlugin({
      templateContent: '<!-- inline_css_plugin -->',
      inject: false
      // minify: {
      //   collapseWhitespace: true
      // },
      // chunksSortMode: 'auto'
    }),
    new HTMLInlineCSSWebpackPlugin({
      replace: {
        target: '<!-- inline_css_plugin -->'
      },
      leaveCSSFile: true
    }),
    new AssetsPlugin({
      useCompilerPath: true
    }),
    new workboxPlugin.GenerateSW({
      swDest: 'sw.js',
      clientsClaim: true,
      skipWaiting: true

    })
  ]
};

// ------------------------------------
// STAGE CONFIGURATION INJECTION! [DEVELOPMENT, PRODUCTION]
// ------------------------------------
const stageConfig = {
  test: {
    devtool: 'source-map',
    stats: {
      chunks: true,
      chunkModules: true,
      colors: true
    }
  },
  development: {
    devtool: 'source-map',
    stats: {
      chunks: true,
      chunkModules: true,
      colors: true
    }
  },
  production: {
    devtool: 'none',
    stats: {
      chunks: true,
      chunkModules: true,
      colors: true
    }
  }
};

const createConfig = () => {
  debug('Creating configuration.');
  debug(`Enabling devtools for '${__NODE_ENV__} Mode!'`);

  const webpackConfig = {
    mode: __DEV__ ? 'development' : 'production',
    name: 'client',
    target: 'node',
    devtool: stageConfig[__NODE_ENV__].devtool,
    stats: stageConfig[__NODE_ENV__].stats,
    module: {
      rules: [...rules]
    },
    ...optimization,
    resolve: {
      modules: ['node_modules'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    }
  };

  // ------------------------------------
  // Entry Points
  // ------------------------------------
  webpackConfig.entry = {
    // app: __DEV__ ? [path.resolve(__dirname, 'src/index.js')].concat(
    //   'webpack-hot-middleware/client?path=/__webpack_hmr'
    // ) : [path.resolve(__dirname, 'src/index.js')],
    server: [path.resolve(__dirname, 'src/server.js')]
  };

  // ------------------------------------
  // Bundle externals
  // ------------------------------------
  if (__PROD__) {
    webpackConfig.externals = {
      react: 'react',
      'react-dom': 'react-dom',
      'prop-types': 'prop-types',
      axios: 'axios'
    };
  }

  debug('Entrou aqui antes do output');
  // ------------------------------------
  // Bundle Output
  // ------------------------------------
  webpackConfig.output = {
    library: 'someLibName',
    filename: '[name].[hash].js',
    chunkFilename: '[name].[hash].js',
    pathinfo: true,
    path: path.resolve(__dirname, 'dist/'),
    publicPath: process.env.PUBLIC_PATH || '/',
    auxiliaryComment: {
      root: 'Root Comment',
      commonjs: 'CommonJS Comment',
      commonjs2: 'CommonJS2 Comment',
      amd: 'AMD Comment'
    }
  };

  // ------------------------------------
  // Plugins
  // ------------------------------------
  debug(`Enable plugins for '${__NODE_ENV__} Mode!'`);
  webpackConfig.plugins = [
    new webpack.DefinePlugin({
      __DEV__,
      __PROD__,
      __TEST__
    }),
    new webpack.DefinePlugin({
      'process.env': {
        ENTRY_POINT_ID: JSON.stringify(process.env.ENTRY_POINT_ID || '')
      }
    }),
    ...stagePlugins[__NODE_ENV__]
  ];

  // ------------------------------------
  // Finishing the Webpack configuration!
  // ------------------------------------
  debug(`Webpack Bundles is Ready for '${__NODE_ENV__} Mode!'`);
  return webpackConfig;
};

module.exports = createConfig();
