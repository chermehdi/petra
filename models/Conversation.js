let mongoose = require('mongoose');

let ConversationSchema = mongoose.Schema({
    name: String, // the convetion of [sender, receiver] sorted and joined by -
    messages: [{body: String, date: Date, sender: String}]
});

module.exports = mongoose.model('conversation', ConversationSchema);