const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const deepmerge = require('deepmerge');

const IndexDatasource = require('./src/datasources/IndexDatasource');
const ViewGeneratorCollection = require('./src/generators/ViewGeneratorCollection');
const LDFragmentServer = require('./src/LDFragmentServer');
const ServerRouter = require('./src/ServerRouter');

// TODO: parse command line arguments
// const args = process.argv.slice(2);

// if (args.length < 1 || args.length > 3 || /^--?h(elp)?$/.test(args[0])) {
//   console.log('usage: server config.json [port [workers]]');
//   process.exit(1);
// }

const defaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './config/default.json')));
const customConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './config/config.json')));

let config = deepmerge(defaultConfig, customConfig);

// TODO: set default logger
this.config.logger = {};

if (config.logging.enabled) {
  const winston = require('winston');
  if (!fs.existsSync(path.join(__dirname, config.logging.folder))) {
    fs.mkdirSync(path.join(__dirname, config.logging.folder));
  }

  const tsFormat = () => (new Date()).toLocaleTimeString();
  config.logging.logger = new (winston.Logger)({
    transports: [
      // colorize the output to the console
      new (winston.transports.Console)({
        timestamp: tsFormat,
        colorize: true,
        level: 'info'
      }),
      new (require('winston-daily-rotate-file'))({
        filename: `${config.logging.folder}/-results.log`,
        timestamp: tsFormat,
        datePattern: 'yyyy-MM-dd',
        prepend: true,
        level: 'verbose'
        // level: env === 'development' ? 'verbose' : 'info'
      })
    ]
  });
}

const baseURL = config.baseURL = config.baseURL.replace(/\/?$/, '/');
const baseURLRoot = baseURL.match(/^(?:https?:\/\/[^/]+)?/)[0];
const baseURLPath = baseURL.substr(baseURLRoot.length);
const blankNodePath = baseURLRoot ? '/.well-known/genid/' : '';
const blankNodePrefix = blankNodePath ? baseURLRoot + blankNodePath : 'genid:';

// Create all data sources
let datasources = config.datasources;
const datasourceBase = baseURLPath.substr(1);

Object.keys(datasources).forEach(function (datasourceName) {
  let datasourceConfig = config.datasources[datasourceName];

  delete datasources[datasourceName];
  const datasourcePath = datasourceBase + encodeURI(datasourceName);

  if (datasourceConfig.enabled !== false) {
    try {
      // Avoid illegal URI characters in data source path
      datasources[datasourcePath] = datasourceConfig;
      // Set up blank-node-to-IRI translation, with dereferenceable URLs when possible
      datasourceConfig.settings = _.defaults(datasourceConfig.settings || {}, config);
      if (!datasourceConfig.settings.blankNodePrefix) {
        datasourceConfig.settings.blankNodePrefix = blankNodePrefix + datasourcePath + '/';
        if (blankNodePath) {
          config.dereference[blankNodePath + datasourcePath + '/'] = datasourcePath;
        }
      }
      // Create the data source
      const typePath = path.join(path.resolve(__dirname, './src/datasources/'), datasourceConfig.type);
      const Constructor = require(typePath);
      let datasource = new Constructor(datasourceConfig.settings);

      datasource.on('error', (error) => {
        delete datasources[datasourcePath];
        config.logging.logger.warn('WARNING: skipped datasource ' + datasourceName + '. ' + error.message + '\n');
      });
      datasourceConfig.datasource = datasource;
      datasourceConfig.url = baseURLRoot + '/' + datasourcePath + '#dataset';
      datasourceConfig.title = datasourceConfig.title || datasourceName;

      config.datasources[datasourceName] = datasourceConfig;
    } catch (error) {
      delete datasources[datasourcePath];
      config.logging.logger.warn('WARNING: skipped datasource ' + datasourceName + '. ' + error.message + '\n');
    }
  }
});

// Create index data source
const indexPath = datasourceBase.replace(/\/$/, '');
datasources[indexPath] = datasources[indexPath] || {
  url: baseURLRoot + '/' + indexPath + '#dataset',
  role: 'index',
  title: 'dataset index',
  datasource: new IndexDatasource({ datasources: datasources })
};

const viewGeneratorCol = new ViewGeneratorCollection();

// load all view generators
viewGeneratorCol.instantiateAll();

const server = new LDFragmentServer(config);

const router = new ServerRouter(config, viewGeneratorCol);

server.setRouter = router;
server.createServer();

server.stopServer();

// TODO: ssl, cluster, run application in cluster workers
