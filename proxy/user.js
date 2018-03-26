var path = require('path');
var models = require('../models');
var User = models.User;
var tools = require('../common/tools');
var Promise = require('bluebird');
var appDebug = require('debug')('app');

exports.newAndSave = function(userObject) {

    return new Promise(function(resolve, reject) {

        var user = new User();
        user.name = userObject.user;
        user.nick = userObject.nick;
        user.email = userObject.email;
        if (userObject.signature) {
            user.signature = userObject.signature;
        }
        tools.bhash(userObject.pass, function(err, hash) {
            if (err) {
                reject(err);
            }
            appDebug('hash '+userObject.pass+' success '+hash);
            user.pass = hash;
            user.save().then(function(data) {
                resolve(data);
            }).catch(function(err) {
                reject(err);
            });
        });
    });
};

exports.getUsersByQuery = function(query, projection, opt) {
    return User.find(query, projection, opt).exec();
};

exports.getUserByName = function(name) {
    return User.findOne({name:name}).exec();
};

exports.getUserById = function(id) {
    return User.find({_id:id}).exec();
};

exports.updateUserProfile = function(obj) {
    return User.update({name:obj.name},{$set: {nick:obj.nick,signature:obj.signature}}).exec();
};

/*
exports.getUsersByIds = function(ids) {
    return User.find({_id:{$in: ids}}).exec();
};


exports.getUsersByNames = function(names) {
    return User.find({name:{$in: names}}).exec();
};

*/
