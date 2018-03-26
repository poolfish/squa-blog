var config = {

    // debug 为 true 时，用于本地调试
    debug: false,

    get mini_assets() { return !this.debug; }, // 是否启用静态文件的合并压缩，详见视图中的Loader

    // cdn host，如 http://cnodejs.qiniudn.com
    site_static_host: '', // 静态文件存储域名


    name: '松鼠博客',
    db: 'mongodb://127.0.0.1/squa-blog',

    // 邮箱配置
    mail_opts: {
        host: 'smtp.163.com',
        port: 25, 
        auth: {
            user: '',
            pass: ''
        },  
        ignoreTLS: true,
    }, 

    // 社区的域名
    host: '',

    session_secret: 'SXXQXXUXXAXXBLOG', // 务必修改
    auth_cookie_name: 'squa-blog',

    // redis 配置，默认是本地
    //redis_host: '127.0.0.1',
    //redis_port: 6379,
    //redis_db: 0,
    //redis_password: '',

    // 分页配置
    blogs_per_page: 5, //首页每页10个博客
    blog_comments_per_page: 10, //blog详情页评论每页10个

};

if (process.env.NODE_ENV === 'test') {
    config.db = 'mongodb://127.0.0.1/squa-blog-test';
}

module.exports = config;
