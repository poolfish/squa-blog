var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commentSchema = new Schema({
    author_id: { type: Schema.Types.ObjectId },
    blog_id: {type: Schema.Types.ObjectId},
    content: String,
    create_at: {type: Date, default: Date.now},
    update_at: {type: Date, default: Date.now}
    });

commentSchema.index({author_id: 1, creat_at: -1});

var Comment = mongoose.model('Comment', commentSchema); 

