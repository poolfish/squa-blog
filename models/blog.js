var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var blogSchema = new Schema({
    title: String,
    content: String,
    //author: String,
    author_id: { type: Schema.Types.ObjectId },
    keywords: {type: [String]},
    total_view: {type: Number, default: 0},
    create_at: {type: Date, default: Date.now},
    update_at: {type: Date, default: Date.now}
    });

blogSchema.index({author_id: 1, creat_at: -1});

var Blog = mongoose.model('Blog', blogSchema); 

