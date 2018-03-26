var express = require('express');
var router = express.Router();
var appDebug = require('debug')('app');
var fs = require('fs');
var validator = require('validator');
var tools = require('../common/tools');
var proxy = require('../proxy');
var UserProxy = proxy.User;
var BlogProxy = proxy.Blog;
var CommentProxy = proxy.Comment;
var mailer = require('../common/mailer'); 
var utility = require('utility');
var config = require('../config');
//var models = require('../models');
//var User = models.User;
var authMiddleWare = require('../middlewares/auth');
var promise = require('bluebird');
var logger = require('../common/logger');


/**
 * define some page when login just jump to the home page
 * @type {Array}
*/
var notJump = [ 
    '/active_account', //active page
    '/reset_pass',     //reset password page, avoid to reset twice
    '/signup',         //regist page
];


// 注册页面
router.get('/signup', function(req, res, next) {

    var data = {};
    res.render('signup', data);
});

// 注册
router.post('/signup', function(req, res, next) {

    appDebug(req.body);

    var email = validator.trim(req.body.Email).toLowerCase();
    var user = validator.trim(req.body.User).toLowerCase();
    var nick = validator.trim(req.body.Nick).toLowerCase();
    var password = validator.trim(req.body.Password);
    var password2 = validator.trim(req.body.Password2);
    
    appDebug(email);
    appDebug(user);
    appDebug(nick);
    appDebug(password);
    appDebug(password2);

    // 验证信息的正确性
    if ([email, user, nick, password, password2].some(function (item) { return item === ''; })) {
        res.status(422);
        res.render('signup', {error: "信息不完整"});
    }
    if (!validator.isEmail(email)) {
        res.status(422);
        res.render('signup', {error: "邮箱不合法"});
    }
    if (user.length < 5) {
        res.status(422);
        res.render('signup', {error: "用户名长度不足8个字符"});    
    }
    if (!tools.validateId(user)) {
        res.status(422);
        res.render('signup', {error: "用户名不合法"});
    }
    if (password !== password2) {
        res.status(422);
        res.render('signup', {error: "两次密码不一致"});
    }

    // 查看用户是否已存在
    UserProxy.getUsersByQuery({'$or': [{'name': user},{'email': email}]},'','').then(function(data) {
        appDebug(data);
        if (data.length > 0) {
            res.status(422);
            res.render('signup', {error: "用户名或邮箱已被占用"});
        } else {
            var obj = {};
            obj.user = user;
            obj.email = email;
            obj.nick = nick;
            obj.pass = password; 
            UserProxy.newAndSave(obj).then(function(data) {
                appDebug(data);
                // 发送激活邮件
                mailer.sendActiveMail(email, utility.md5(email + data.pass + config.session_secret), user);
                res.render('signup', 
                {success: "用户注册成功,已经将激活邮件发送您的邮箱"+email+", 请登录邮箱通过激活邮件里的链接激活用户"});
            }).catch(function(err) {
                appDebug(err);
                res.status(404);
                res.render('signup', {error: "服务端内部错误"})
            });
        }
    }).catch(function(err) {
        appDebug(err);
        res.status(404);
        res.render('signup', {error: "服务端内部错误"});
    });
});

// 激活账户
router.get('/active_account', function(req, res, next) {

    var key  = validator.trim(req.query.key);
    var name = validator.trim(req.query.name);

    UserProxy.getUserByName(name).then(function(data) {
        appDebug(data);
        appDebug(utility.md5(data.email + data.pass + config.session_secret));
        appDebug(key);
        if (!data || utility.md5(data.email + data.pass + config.session_secret) !== key) {
            return res.render('notify', {error: '信息有误，帐号无法被激活。'});
        }   
        if (data.active) {
            return res.render('notify', {error: '帐号已经是激活状态。'});
        }   
        data.active = true;
        data.save().then(function(data) {
            appDebug(data);
            res.render('notify', {success: '帐号已被激活，请登录'});
        }).catch(function(err) {
            appDebug(err);
            return next(err);
        });
    }).catch(function(err) {
        appDebug(err);
        return next(err);
    });
});

// 登录页面
router.get('/login', function(req, res, next) {

    var data = {};
    res.render('login', data);
});

// 登录
router.post('/login', function(req, res, next) {

    var user = validator.trim(req.body.User).toLowerCase();
    var password = validator.trim(req.body.Password);
    
    appDebug(user);
    appDebug(password);

    UserProxy.getUserByName(user).then(function(data) {

        appDebug(data);
        if (!data) {
            return res.render('login', {error: '账户不存在'});
        }   

        var is_active = data.active;
        var email = data.email;
        var user_info = data;

        tools.bcompare(password, data.pass, function(err, equal) {

            if (err || !equal) return res.render('login', {error: '密码不正确'});

            if (!is_active) {
                res.status(403);
                return res.render('login', { error: '此帐号还没有被激活，激活链接已发送到 ' + email + ' 邮箱，请查收。' });
            }

            // store session cookie
            authMiddleWare.gen_session(user_info, res);

            // check at some page just jump to home page
            var refer = req.session._loginReferer || '/';
            for (var i = 0, len = notJump.length; i !== len; ++i) {
                if (refer.indexOf(notJump[i]) >= 0) {
                    refer = '/';
                    break;
                }
            }
            res.redirect(refer);
        });
    }).catch(function(err) {
        appDebug(err);
        return next(err);
    });
});

/* GET write_blog */
router.get('/write_blog', authMiddleWare.userRequired, function(req, res, next) {
    var data = {};
    res.render('write_blog', data);
});

/* logout */
router.post('/logout', authMiddleWare.userRequired, function(req, res, next) {
    req.session.destroy();
    res.clearCookie(config.auth_cookie_name, { path: '/' }); 
    res.send({});
});

router.post('/write_blog', authMiddleWare.userRequired, function(req, res, next) {
    var title = validator.trim(req.body.b_title).toLowerCase();
    var content = req.body.b_content;
    var keywords = validator.trim(req.body.b_keywords).split(' ');

    appDebug("blog_title: "+title);
    appDebug("blog_content: "+content);
    appDebug("blog_keywords: "+keywords);
    appDebug("blog_author: "+res.locals.current_user);

    var obj = {};
    obj.title = title;
    obj.keywords = keywords;
    obj.content = content;
    obj.author = res.locals.current_user._id;

    BlogProxy.newAndSave(obj).then(function(data) {
        appDebug(data);
        res.redirect('/blog_detail/'+data._id);
    }).catch(function(err) {
        appDebug(data);
        next(err);
    });
});

router.post('/edit_blog', authMiddleWare.userRequired, function(req, res, next) {
    var title = validator.trim(req.body.b_title).toLowerCase();
    var content = req.body.b_content;
    var keywords = validator.trim(req.body.b_keywords).split(' ');
    var blog_id = validator.trim(req.body.blog_id);

    appDebug("blog_title: "+title);
    appDebug("blog_content: "+content);
    appDebug("blog_keywords: "+keywords);
    appDebug("blog_id: "+blog_id);
    appDebug("blog_author: "+res.locals.current_user);

    var obj = {};
    obj.title = title;
    obj.keywords = keywords;
    obj.content = content;
    obj.blog_id = blog_id;
    obj.author = res.locals.current_user._id;

    var requests = BlogProxy.updateBlog(obj);
    requests[0].then(data=>{
        appDebug(data);
        promise.all([requests[1],requests[2]]).then(data=>{
            appDebug(data);
            res.redirect('/blog_detail/'+ blog_id);
        }).catch(err => {
            appDebug(err);
            next(err);
        });
    }).catch(err=>{
        appDebug(err);
        next(err);
    });
});

// 处理编辑blog的请求
router.get('/edit_blog/:bid', authMiddleWare.userRequired, function(req, res, next) {

    var blog_id = req.params.bid;
    appDebug('blog_id: '+blog_id);
    var blog_info = {};
    BlogProxy.getBlogById(blog_id).then(function(data) {
        appDebug(data);
        if (!data || data.length !== 1) {
            next();
        }
        blog_info.title = data[0].title;
        blog_info.keywords = data[0].keywords.join(' ');
        blog_info.content = data[0].content;
        blog_info.blog_id = blog_id;
        blog_info.author_id = data[0].author_id;
        res.render('edit_blog',blog_info);
    }).catch(function(err) {
        appDebug(err);
        next(err);
    });
});

// 博客内容详情
router.get('/blog_detail/:bid', function(req, res, next) {

    var blog_id = req.params.bid;
    appDebug('blog_id: '+blog_id);
    var blog_info = {};
    
    BlogProxy.getBlogById(blog_id).then(function(data) {
        appDebug(data);
        if (!data || data.length !== 1) {
            next();
        }
        BlogProxy.incrTotalView(blog_id).then(data=>{});
        blog_info.title = data[0].title;
        blog_info.keywords = data[0].keywords;
        blog_info.content = data[0].content;
        blog_info.blog_id = blog_id;
        blog_info.author_id = data[0].author_id;

        var requests = new Array();
        requests.push(CommentProxy.getBlogCommentsNum(blog_id));
        requests.push(CommentProxy.getBlogCommentsPage(blog_id,1));
        promise.all(requests).then(results=>{
            appDebug("results=>"+results);
            blog_info.total_pages = Math.floor((results[0]+config.blog_comments_per_page-1)/config.blog_comments_per_page);
            blog_info.comments = results[1];
            res.render('blog_detail', blog_info);
        }).catch(err=>{
            appDebug(err);
            next(err);
        });
    }).catch(function(err) {
        appDebug(err);
        next(err);
    });
});

router.post('/getBlogCommentsPage/:bid', function(req, res, next) {

    var blog_id = req.params.bid;
    appDebug('blog_id: '+blog_id);
    var blogCommentsPage = {};
    
    var requests = new Array();
    requests.push(CommentProxy.getBlogCommentsNum(blog_id));
    requests.push(CommentProxy.getBlogCommentsPage(blog_id,req.body.page));
    promise.all(requests).then(results=>{
        appDebug("results=>"+results);
        blogCommentsPage.total_pages = Math.floor((results[0]+config.blog_comments_per_page-1)/config.blog_comments_per_page);
        blogCommentsPage.comments = results[1];
        res.send(JSON.stringify(blogCommentsPage));
    }).catch(err=>{
        appDebug(err);
        next(err);
    });
});

/* GET home page. */
router.get('/', function(req, res, next) {

    var data = {};

    BlogProxy.getBlogsNum().then(num => {
        appDebug('num='+num);
        data["totalPages"] = num;
    });

    var author_board = JSON.parse(fs.readFileSync('test_data/author_board.json'));
    var blog_board = JSON.parse(fs.readFileSync('test_data/blog_board.json'));
    var data = {};
    data["authors"] = author_board.data;
    data["blogs"] = blog_board.data;

    appDebug(data);
    logger.info('GET / , data: '+data);
    res.render('index', data); 
});

// 获取首页博客分页数据
router.post('/getBlogsPage',function(req, res, next){

    appDebug('page: ' + req.body.page);

    let data = {};
    //var data = JSON.parse(fs.readFileSync('test_data/blog_info_'+page+'.json'));

    var requests = new Array();
    requests.push(BlogProxy.getBlogsNum());
    requests.push(BlogProxy.getBlogsPage(req.body.page, config.blogs_per_page));
    appDebug('requests ready');
    promise.all(requests).then(results=>{
        appDebug("results=>"+results);
        data.total_pages = Math.floor((results[0]+config.blogs_per_page-1)/config.blogs_per_page);
        data.blogs = results[1];
        res.send(JSON.stringify(data));
    }).catch(err=>{
        appDebug(err);
        next(err);
    });
});

/* add comment. */
router.post('/:bid/addcomment', function(req, res, next) {
    var obj = {};
    obj.blog_id = req.params.bid;
    obj.author_id = req.body.author_id;
    obj.content = req.body.comment; 
    appDebug('blog_id:'+obj.blog_id);
    appDebug('author_id:'+obj.author_id);
    appDebug('content:'+obj.content);

    CommentProxy.newAndSave(obj).then(data => {res.send(JSON.stringify(data));})
    .catch(err => {appDebug(err)});
});

/* delete comment. */
router.post('/delcomment/:cid', function(req, res, next) {
    var obj = {};
    obj.comment_id = req.params.cid;
    appDebug('comment_id:'+obj.comment_id);

    CommentProxy.delComment(obj.comment_id).then(data => {res.send(JSON.stringify(data));})
    .catch(err => {appDebug(err)});
});

router.post('/delblog/:bid', authMiddleWare.adminRequired,function(req, res, next) {
    appDebug('blog_id:'+req.params.bid);

    BlogProxy.delBlog(req.params.bid).then(data => {res.send(JSON.stringify(data));})
    .catch(err => {appDebug(err)});
});

/* GET forgot_pass. */
router.get('/forgot_pass', function(req, res, next) {
    var data = {};
    res.render('forgot_pass', data);
});

/* retrieve pass via email. */
router.post('/forgot_pass', function(req, res, next) {
    appDebug(req.body);
    var email = validator.trim(req.body.Email);
    
    appDebug(email);
    res.render('forgot_pass', {success:1});
});

/* GET about. */
router.get('/about', function(req, res, next) {
    var data = {};
    res.render('about', data);
});

/* GET contact. */
router.get('/contact', function(req, res, next) {
    var data = {};
    res.render('contact', data);
});


module.exports = router;
