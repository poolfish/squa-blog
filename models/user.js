var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    pass: String,
    nick: String,
    email: String,
    active: {type: Boolean, default: false},
    //gender: {type: String, default: '保密'},
    signature: {type: String, default: '这人很懒，什么也没有留下~~~'},
    //avatar: String,
    create_at: {type: Date, default: Date.now},
    update_at: {type: Date, default: Date.now}
    });

userSchema.index({name: 1}, {unique: true});
userSchema.index({email: 1}, {unique: true});

var User = mongoose.model('User', userSchema); 

