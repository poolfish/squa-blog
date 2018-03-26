var config = require('../config');

var env = process.env.NODE_ENV || "development"


var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'log/cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

var logger = log4js.getLogger('cheese');
//logger.setLevel(config.debug && env !== 'test' ? 'DEBUG' : 'ERROR')

module.exports = logger;
