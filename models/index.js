var config = require('../config');
var mongoose = require('mongoose');
var Promise = require('bluebird');

mongoose.Promise = Promise;

mongoose.connect(config.db, { server: {poolsize: 20}},
    function(err) {
        if (err) {
            console.log('connect %s error %s', config.db, err.message);
            process.exit(1);
        }
        console.log('connect %s success', config.db);
    });
     
require('./user');
require('./blog');
require('./comment');

exports.User = mongoose.model('User');
exports.Blog = mongoose.model('Blog');
exports.Comment = mongoose.model('Comment');
