let mongoose = require('mongoose');

let StudentSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    cne: String,
    password: String,
    image: String,
    lessons: Number,
    tests: Number,
    progress: Number,
    phone: String,
    email: String,
    lessonsDone: [{type: String}],
    testsDone: [{type: String}]
});

module.exports = mongoose.model('student', StudentSchema);