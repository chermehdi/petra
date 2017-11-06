let express = require('express');
let application = express();

let studentapp = require('./app/student');
let adminapp = require('./app/admin');
let mongoose = require('mongoose');

let server = require('http').createServer(application);
let io = require('socket.io').listen(server);

mongoose.connect('mongodb://localhost:27017/petra'); // replace this with your database configuration
const PORT = 3000;


let connectedUsers = {};
let connectedStudents = {};
let connectedAdmins = {};

let rtc = {};
let admin = '';


let Conversation = require('./models/Conversation');
let Student = require('./models/Student');
let Admin = require('./models/Admin');

application.use(express.static('public'));
application.set('view engine', 'ejs');

application.use('/admin', adminapp);
application.use('/student', studentapp);

application.get('/', (req, res) => {
    res.render('index');
});


server.listen(PORT, () => {
    console.log('listening on port ' + PORT);
});
/**
 * Socket io handling
 */
io.sockets.on('connection', (socket) => {

    socket.on('new_rtc_user', (data) => {
        rtc[data.name] = socket;
        socket.emit('rtc_admin', {admin: admin});
        console.log('current rtc client is ', data.name);
    })

    socket.on('new_rtc_admin', (data) =>{
        rtc[data.name] = socket;
        admin = data.name;
        console.log('the current administrator is ', admin);
    })


    socket.on('rtc', (data) => {
        console.log('the received rtc data is ', data.content);
        if (data.content.type === 'answer') {
            rtc[data.to].emit('rtc-answer', data.content);
        } else {
            rtc[data.to].emit('rtc', data.content);
        }
    })

    console.log('new user connected ' + socket.id);
    io.sockets.emit('student_list', {list: Object.keys(connectedStudents)});
    /*   Socket.on('new_user', (data) => {
     Socket.userName = data.name;
     connectedUsers[data.name] = Socket;
     console.log(Object.keys(connectedUsers));
     io.sockets.emit('user_list', {
     list: Object.keys(connectedUsers)
     });
     });*/

    socket.on('new_student', (data) => {
        socket.userName = data.name;
        connectedStudents[data.name] = socket;
        //for (let admin of Object.keys(connectedAdmins)) {
        //  console.log('emiting student list to ', admin);
        //   connectedAdmins[admin].emit('student_list', {list: Object.keys(connectedStudents)});
        io.sockets.emit('student_list', {list: Object.keys(connectedStudents)});
        //}
        console.log('the student list ', Object.keys(connectedStudents));
        console.log('the admin list  ', Object.keys(connectedAdmins));
    });

    socket.on('new_admin', (data) => {
        socket.userName = data.name;
        connectedAdmins[data.name] = socket;
        admin = data.name;
        console.log('the student list ', Object.keys(connectedStudents));
        console.log('the admin list  ', Object.keys(connectedAdmins));
    });

    socket.on('get_conversation_student', (data) => {
        let admins = Object.keys(connectedAdmins);
        if (admins.length > 0) {
            findAllConvaersations(data.from, admins[0], function (err, content) {
                console.log('the messages got in conversation ', JSON.stringify(content));
                socket.emit('messages_list', {
                    list: content
                });
            })
        }
    });
    socket.on('get_conversation_admin', (data) => {
        findAllConvaersations(data.from, data.to, function (err, content) {
            console.log('the messages got in conversation ', JSON.stringify(content));
            socket.emit('messages_list', {
                list: content
            });
        })
    });

    socket.on('disconnect', () => {
        if (socket.userName in connectedStudents) {
            delete connectedStudents[socket.userName];
        }
        if (socket.userName in connectedAdmins) {
            delete connectedAdmins[socket.userName];
        }
        console.log(Object.keys(connectedUsers));
        io.sockets.emit('student_list', {list: Object.keys(connectedStudents)});
    });

    socket.on('new_message_admin', (data) => {
        console.log(Object.keys(connectedUsers));
        console.log('this is the user data ', JSON.stringify(data));
        let convName = getConversationName(data.to, data.from);

        Conversation.findOne({
            name: convName
        }, (err, obj) => {
            if (err)
                throw err;
            if (obj) {
                obj.messages.push({
                    body: data.body,
                    date: data.date,
                    sender: data.from
                });
                obj.save(function () {
                    console.log('object saved');
                });
            } else {
                let cc = new Conversation({
                    name: convName,
                    messages: [{
                        body: data.body,
                        date: data.date,
                        sender: data.from
                    }]
                });
                cc.save();
            }
        });
        let col = Conversation.findOne({
            name: convName
        }, (err, content) => {
            if (!content) content = {};
            let ret = content.messages || [];
            ret.sort((a, b) => {
                let aa = new Date(a),
                    bb = new Date(b);
                return aa < bb ? -1 : aa > bb ? 1 : 0;
            });
            console.log('this is the conversation list ', ret);
        });
        console.log('sending to ', data.to, ' the message ', JSON.stringify(data));
        connectedStudents[data.to].emit('new_message_student', data);
    });

    socket.on('new_message_student', (data) => {
        let admins = Object.keys(connectedAdmins);
        if (admins.length > 0) {
            let convName = getConversationName(admins[0], data.from);
            Conversation.findOne({
                name: convName
            }, (err, obj) => {
                if (err)
                    throw err;
                if (obj) {
                    obj.messages.push({
                        body: data.body,
                        date: data.date,
                        sender: data.from
                    });
                    obj.save(function () {
                        console.log('object saved');
                    });
                } else {
                    let cc = new Conversation({
                        name: convName,
                        messages: [{
                            body: data.body,
                            date: data.date,
                            sender: data.from
                        }]
                    });
                    cc.save();
                }
            });
            let col = Conversation.findOne({
                name: convName
            }, (err, content) => {
                if (!content) content = {};
                let ret = content.messages || [];
                ret.sort((a, b) => {
                    let aa = new Date(a),
                        bb = new Date(b);
                    return aa < bb ? -1 : aa > bb ? 1 : 0;
                });
                console.log('this is the conversation list ', ret);
            });
            data.to = admins[0];
            connectedAdmins[admins[0]].emit('new_message_admin', data);
        }
    })

});


/**
 * Helper functions
 * @param obj
 * @param arr
 * @returns {boolean}
 */
function findUser(obj, callback) {
    User.findOne({
        name: obj.name,
        password: obj.password
    }, (err, content) => {
        if (err) throw err;
        if (content) {
            callback(content);
        } else {
            callback(null);
        }
    });
}

function findAllConvaersations(sender, receiver, callback) {
    let convName = getConversationName(sender, receiver);

    let col = Conversation.findOne({
        name: convName
    }, (err, content) => {
        if (err) {
            callback(err, []);
        } else {
            if (content === null) {
                content = {};
            }
            if (!content.messages) {
                content.messages = [];
            }
            let ret = content.messages;
            ret.sort((a, b) => {
                let aa = new Date(a.date),
                    bb = new Date(b.date);
                return aa < bb ? -1 : aa > bb ? 1 : 0;
            });
            callback(err, ret);
        }
    });
}

function getConversationName(sender, receiver) {
    console.log('trying to find the conversation with name ', [sender, receiver].sort().join("-"));
    return [sender, receiver].sort().join("-");
}
