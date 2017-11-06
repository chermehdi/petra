let mongoose = require('mongoose');

let PendingStudentSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    cne: String,
    password: String,
    image: String,
    lessons: Number,
    tests: Number,
    progress: Number,
    phone: String,
    email: String
});

module.exports = mongoose.model('request', PendingStudentSchema);