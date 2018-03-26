var mongoose   = require('mongoose');
//var UserModel  = mongoose.model('User');
var config     = require('../config');
var UserProxy = require('../proxy/user');
var appDebug = require('debug')('app');


// 生成用户cookie
function gen_session(user, res) {

  var auth_token = user._id + '$$$$'; // 以后可能会存储更多信息，用 $$$$ 来分隔
  var opts = {
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
    signed: true,
    httpOnly: true
  };
  res.cookie(config.auth_cookie_name, auth_token, opts); //cookie 有效期30天
}

exports.gen_session = gen_session;

// 验证用户是否登录
exports.authUser = function (req, res, next) {

    // Ensure current_user always has defined.
    res.locals.current_user = null;

    /*
    if (config.debug && req.cookies['mock_user']) {
        var mockUser = JSON.parse(req.cookies['mock_user']);
        req.session.user = new UserModel(mockUser);
        if (mockUser.is_admin) {
            req.session.user.is_admin = true;
        }
        return next();
    }
    */
    appDebug('req.session.user: '+req.session.user);
    if (req.session.user) {
        res.locals.current_user = req.session.user;
        next();
    } else {
        var auth_token = req.signedCookies[config.auth_cookie_name];
        if (!auth_token) {
            return next();
        }

        var auth = auth_token.split('$$$$');
        var user_id = auth[0];
        appDebug('user_id: '+user_id);
        UserProxy.getUserById(user_id)
        .then(function(data) {
            if (!data || data.length !== 1) return next();
            appDebug(data);
            res.locals.current_user = req.session.user = data[0];
            next();
        }).catch(function(err) {
            appDebug(err);
            return next();
        });
    }
};

/**
 * 需要登录
 */
exports.userRequired = function (req, res, next) {

    if (!req.session || !req.session.user || !req.session.user._id) {
        return res.status(403).send('forbidden!');
    }

    next();
};

exports.adminRequired = function (req, res, next) {

    if (!req.session || !req.session.user || !req.session.user.name || req.session.user.name !=='admin') {
        return res.status(403).send('forbidden!');
    }

    next();
};
