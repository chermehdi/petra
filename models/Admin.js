let mongoose = require('mongoose');

let AdminSchema = mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    phone: String,
    image: String
});

module.exports = mongoose.model('admin', AdminSchema);