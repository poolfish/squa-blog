var express = require('express');
var router = express.Router();
var appDebug = require('debug')('app');
var proxy = require('../proxy');
var UserProxy = proxy.User;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET user profile. */
router.get('/:uid', function(req, res, next) {
    var uid = req.params.uid;
    var data = {};
    data.user = uid;
    UserProxy.getUserByName(uid).then(function(user) {
        appDebug(user);
        if (!user) {
            return res.render('notify', {error: '信息有误。'});
        }
		data.email = user.email; 
		data.signature = user.signature;
		data.nick = user.nick;
		res.render('user_profile',data);
		
    }).catch(function(err) {
        appDebug(err);
        return next(err);
    });

});

/* retrieve pass via email. */
router.post('/:bid/edit', function(req, res, next) {
    var obj = {}; 
    obj.name = req.params.bid;
    obj.nick = req.body.nick;
	obj.signature = req.body.signature;
    appDebug('obj:'+obj);

    UserProxy.updateUserProfile(obj).then(data => {res.send(JSON.stringify(data));})
    .catch(err => {appDebug(err)});
});

module.exports = router;
