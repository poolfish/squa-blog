var path = require('path');
var models = require('../models');
var User = models.User;
var Blog = models.Blog;
var Comment = models.Comment;
var tools = require('../common/tools');
var Promise = require('bluebird');
var appDebug = require('debug')('app');
var Promise = require('bluebird');
var trimHtml = require('trim-html');

exports.newAndSave = function(blogObject) {

    var blog = new Blog();

    blog.title = blogObject.title;
    for (var i = 0; i<blogObject.keywords.length; i++) {
        blog.keywords[i] = blogObject.keywords[i];
    }
    blog.content = blogObject.content;
    blog.author_id = blogObject.author;

    return blog.save();
};

exports.updateBlog = function(blogObject) {
    var requests = new Array();
    requests.push(Blog.update({_id:blogObject.blog_id},{$unset: {keywords:""}}));
    requests.push(Blog.update({_id:blogObject.blog_id},{$push: {keywords:{$each:blogObject.keywords}}}));
    requests.push(Blog.update({_id:blogObject.blog_id},{$set: {content:blogObject.content,title:blogObject.title}}));
    return requests;
};

exports.getBlogById = function(id) {
    return Blog.find({_id:id}).exec();
};

exports.getBlogsNum = function() {
    return Blog.count({}).exec();
};

// 描述: 返回某页的博客, 按更新时间降序
// page: 当前的页号，1开始
// blogsPerPage: 每页的博客数
/*
exports.getBlogsPage = function(user, page, blogsPerPage) {
    return Blog.find({author_id:user})
        .skip(blogsPerPage*(page-1))
        .limit(blogsPerPage)
        .exec();
};
*/
exports.getBlogsPage = function(page, blogsPerPage) {
	return new Promise((resolve,reject) => {
		var blog_info = new Array();
		Blog.find({})
			.sort({update_at: -1})
			.skip(blogsPerPage*(page-1))
			.limit(blogsPerPage)
			.populate({
					path: 'author_id',
					select: 'name',
					model: 'User'})
			.exec().then(results => {
				appDebug(results);
				var queries = new Array();
				for (let i = 0; i < results.length; i++) {
					let tmp = {}; 
					tmp["title"] = results[i].title;
					tmp["blog_id"] = results[i]._id; 
					tmp["author"] = results[i].author_id.name;
					tmp["keywords"] = results[i].keywords;
					let trim = trimHtml(results[i].content, {limit:100, preserveTags:false, sufix:'...'});
					tmp["contents"] = trim.html;
					tmp["total_view"] = results[i].total_view;
					tmp["total_comments"] = 0;
					blog_info.push(tmp);
					queries.push(Comment.count({blog_id:results[i]._id})
						.exec());
				}
				Promise.all(queries).then(results => {
					appDebug(results);	
					for (let i = 0; i < blog_info.length; i++) {
						blog_info[i].total_comments = results[i];
					}
					appDebug("blog_info: "+blog_info);
					//return blog_info;
					resolve(blog_info);
				}).catch(err => {
					appDebug(err);
					//return blog_info;
					reject(err);
				});
			}).catch(err => {
				appDebug(err);
				reject(err);
			});
	});
};

exports.incrTotalView = function(id) {
    return Blog.update({_id:id},{$inc: {total_view:1}}).exec();
};

exports.delBlog = function(id) {
    return Blog.remove({_id:id}).exec();
};

/*
exports.getUsersByQuery = function(query, projection, opt) {
    return User.find(query, projection, opt).exec();
};

exports.getUserByName = function(name) {
    return User.findOne({name:name}).exec();
};


exports.getUsersByIds = function(ids) {
    return User.find({_id:{$in: ids}}).exec();
};


exports.getUsersByNames = function(names) {
    return User.find({name:{$in: names}}).exec();
};

*/
