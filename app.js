var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('./common/logger');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
//var RedisStore = require('connect-redis')(session);
const MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var config = require('./config');
var auth = require('./middlewares/auth');
var Loader = require('loader');
var _ = require('lodash');
var index = require('./routes/index');
var users = require('./routes/users');
var errorhandler = require('errorhandler');
var mongoose = require('mongoose');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.engine('ejs', require('ejs-mate'));
//app.locals._layoutFile = 'layout.ejs';

// assetsMap
var assetsMap = {};

if (config.mini_assets) {
  try {
    assetsMap = require('./assets.json');
  } catch (e) {
    logger.error('You must execute `bash generate_assetsMap.sh` before start app when mini_assets is true.');
    throw e;
  }
}

_.extend(app.locals, {
    config: config,
    Loader: Loader,
    assetsMap: assetsMap,
});
_.extend(app.locals, require('./common/render_helper'));

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(config.session_secret));
app.use(session({
    secret: config.session_secret,
    //store: new RedisStore({
        //port: config.redis_port,
        //host: config.redis_host,
        //db: config.redis_db,
        //pass: config.redis_password,
    //}), 
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    resave: false,
    saveUninitialized: false,
}));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(auth.authUser);

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
if (config.debug) {
    app.use(errorhandler);
} else {
    app.use(function(err, req, res, next) {
        logger.error(err);
        return res.status(500).send('500 status');
    });
}

module.exports = app;
if (!module.parent) {
    app.listen(process.env.PORT || 5000, ()=>{
        logger.info('squa-blog listening on '+(process.env.PORT || 5000));
    }); 
}

module.exports = app;
