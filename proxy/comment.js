var path = require('path');
var models = require('../models');
var User = models.User;
var Blog = models.Blog;
var Comment = models.Comment;
var tools = require('../common/tools');
var Promise = require('bluebird');
var appDebug = require('debug')('app');
var config = require('../config');

exports.newAndSave = function(obj) {

    var comment = new Comment();

    comment.author_id = obj.author_id;
    comment.content = obj.content;
    comment.blog_id = obj.blog_id

    return comment.save();
};

exports.getBlogComments = function(blog_id) {
    return Comment.find({blog_id:blog_id})
            .sort({update_at:-1})
            .populate({
                path: 'author_id',
                select: 'name',
                model: 'User'})
            .exec();
};

exports.getBlogCommentsNum = function(blog_id) {
    return Comment.count({blog_id:blog_id})
            .exec();
};

exports.getBlogCommentsPage = function(blog_id,page) {
    return Comment.find({blog_id:blog_id})
            .sort({update_at:-1})
            .skip((page-1)*config.blog_comments_per_page)
            .limit(config.blog_comments_per_page)
            .populate({
                path: 'author_id',
                select: 'name',
                model: 'User'})
            .exec();
};

exports.delComment = function(comment_id) {
    return Comment.remove({_id:comment_id})
            .exec();
};

