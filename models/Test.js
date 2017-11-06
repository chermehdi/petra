let mongoose = require('mongoose');

let TestSchema = mongoose.Schema({
    name: String,
    path: String,
    author: String,
    type: String,
    originalName: String
});

module.exports = mongoose.model('test', TestSchema);