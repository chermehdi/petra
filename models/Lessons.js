let mongoose = require('mongoose');

let LessonSchema = mongoose.Schema({
    name: String,
    path: String,
    author: String,
    originalName: String
});

module.exports = mongoose.model('lesson', LessonSchema);