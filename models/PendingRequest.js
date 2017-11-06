let mongoose = require('mongoose');

let PendingRequestSchema = mongoose.Schema({
    fullName: String,
    email: String,
    image: String
});

module.exports = mongoose.model('pending', PendingRequestSchema);