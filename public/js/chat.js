let name = document.getElementById('username').textContent.trim();
let textArea = document.getElementById('message');
let send = document.getElementById('send');
let chatMessages = document.getElementById('chat-messages');
let chatPanel = document.getElementById('chat-panel');
let userInput = document.getElementById('user-input');
var sendButton = document.getElementById('send');
let destUser = undefined;
let userListContainer = document.getElementById('user-list-container');
let debug = undefined;
/**
 * Socket Io Stuff
 */
let socket = io.connect();
let active = "";

socket.emit('new_admin', {name: name});

/**
 * add a notification to the conversation with the user whose name is actifName
 * @param actifName
 */

function addNotification(actifName) {
    let connectedUsers = document.querySelectorAll('.collection-item.avatar');
    console.log('here is connected users list ', connectedUsers);
    for (let i = 0; i < connectedUsers.length; i++) {
        if (connectedUsers[i].childNodes[2].textContent === actifName) {
            let span = connectedUsers[i].childNodes[3];
            if (span.classList.contains('badge')) {
                let count = parseInt(span.textContent);
                span.textContent = (count + 1) + '';
            } else {
                span.classList.add('new');
                span.classList.add('badge');
                span.textContent = '1';
            }
        }
    }
}
function createListView() {
    let ul = document.createElement('ul');
    ul.className = 'collection';
    ul.id = 'user-list';
    return ul;
}
socket.on('new_message_admin', (data) => {
    let newMessage = createMessage(data.body, 'received-message', data.from, getDateString(data.date));
    let currentActif = destUser || '';
    if (currentActif !== data.from) {
        console.log('a message received from ', data.from, ' the current actif user is ', currentActif);
        addNotification(data.from);
    }
    console.log('message received from student ', data);
    if (data.from != destUser) {
        return false;
    }
    // emptying the div
    console.log('this is the date of the message ', (new Date(data.date)).toDateString());
    if (noMessagesBefore()) {
        emptyDiv(chatMessages);
        chatMessages.classList.remove('center-content');
        chatMessages.classList.remove('verticaly');
        chatPanel.classList.remove('center-content');
    }
    addNewMessage(newMessage);
});

socket.on('student_list', (data) => {
    let users = document.getElementById('user_list');
    console.log('the receicved data is ', JSON.stringify(data));
    //data.list.splice(data.list.indexOf(name), 1);
    if (data.list.length == 0) {
        emptyDiv(userListContainer);
        createNoUserConnectedView(userListContainer);
        return false;
    }
    else {
        if (!users)
            users = createListView();
        emptyDiv(userListContainer);
        emptyDiv(users);
    }
    userListContainer.classList.remove('center-content');
    userListContainer.appendChild(users);

    console.log('user_list event ', data.list, 'is the list from the server ');

    let newUser = createNewUser(data.list);

    debug = newUser;
    for (let i = 0; i < newUser.length; i++) {
        let a = newUser[i];
        users.appendChild(a);
    }

    let connectedUsers = document.querySelectorAll('#user-list li');

    for (let i = 0; i < connectedUsers.length; i++) {
        // toggling the actif class over all the elements
        let self = connectedUsers[i];
        connectedUsers[i].addEventListener('click', (e) => {
            e.preventDefault();
            let currentActif = document.querySelector('.actif');
            if (currentActif) {
                currentActif.classList.remove('actif');
                //currentActif.classList.remove('actif');
            }
            self.classList.add('actif');
            let span = connectedUsers[i].childNodes[3];
            if (span.classList.contains('badge')) {
                span.classList.remove('badge');
                span.classList.remove('new');
                span.textContent = '';
            }
            //self.childNodes[0].classList.add('actif');

            loadUserConversation(self);
        });
    }
});
/**
 * loading the conversation of the target
 * @param target anchor tag
 */
function loadUserConversation(anchor) {
    let currentUser = document.querySelector('.actif p').textContent;
    destUser = currentUser;
    // Send Request To Socket to load connversations
    socket.emit('get_conversation_admin', {to: destUser, from: name});
    // Mark the current User as the global current user ?
    console.log('send a message from ' + name + ' to ' + destUser);
}
socket.on('messages_list', (data) => {
    if (data.list.length === 0) {
        return false;
    }

    emptyDiv(chatMessages);
    chatMessages.classList.remove('center-content');
    chatMessages.classList.remove('verticaly');
    chatPanel.classList.remove('center-content');

    let arr = data.list;

    for (let i = 0; i < arr.length; i++) {
        let className = arr[i].sender === name ? 'sended-message' : 'received-message';
        let message = createMessage(arr[i].body, className, arr[i].sender, getDateString(arr[i].date));
        chatMessages.appendChild(message);
    }
    $(chatPanel).animate({scrollTop: $(chatPanel).prop("scrollHeight")}, 500);
});

/**
 * Chat Messages Handling
 */
userInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
        if (noMessagesBefore()) {
            emptyDiv(chatMessages);
            chatMessages.classList.remove('center-content');
            chatPanel.classList.remove('verticaly');
            chatPanel.classList.remove('center-content');
        }
        sendMessage(e.target.value.trim());
        e.target.value = "";
    }
});

sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage(userInput.value.trim());
    userInput.value = "";
});
function addNewMessage(current) {
    chatMessages.appendChild(current);
    $(chatPanel).animate({scrollTop: $(chatPanel).prop("scrollHeight")}, 500);
}

function sendMessage(message) {
    // only execute this method if a destination user is defined
    if (destUser) {
        // Display the message in the UI
        let currentDate = new Date();
        let current = createMessage(message, 'sended-message', name, currentDate.toTimeString());
        addNewMessage(current);
        // Send The message to the receiver
        if (!name || name === "") {
            console.error('the name is empty why ? ');
        }

        let objectToSend = {
            to: destUser,
            from: name,
            body: message,
            date: currentDate
        };

        socket.emit('new_message_admin', objectToSend);
    }
}
/**
 * Helper Functions
 * @param list
 * @returns {Array}
 */

function noMessagesBefore() {
    return chatMessages.children[0].tagName === "I";
}
function createNewUser(list) {
    let currentUsers = [];
    for (let a of list) {
        currentUsers.push(createSingleUser(a, "user.png"));
    }

    return currentUsers;
}

function createMessage(str, className, username, time) {
    let row = document.createElement('div'),
        col = document.createElement('div'),
        messageDiv = document.createElement('div'),
        messageHeader = document.createElement('p'),
        messageBody = document.createElement('p');
    row.className = 'row';
    col.className = 'col s8 ' + (className == 'received-message' ? '' : 'offset-s4');
    messageDiv.className = className;
    messageHeader.className = 'message-header';
    messageBody.className = 'message-content';
    messageHeader.textContent = username;
    messageBody.textContent = str;
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageBody);
    col.appendChild(messageDiv);
    row.appendChild(col);
    return row;
}

function getUserImage(name, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    // get the image of the student with the name name
    xhr.open('GET', '/student/images/' + name, true);
    xhr.send(null);
}


function createSingleUser(username, image) {
    let li = document.createElement('li'),
        img = document.createElement('img'),
        name = document.createElement('span'),
        p = document.createElement('p'),
        badge = document.createElement('span');
    li.className = 'collection-item avatar';
    img.className = 'circle';
    img.src = 'images/' + image;
    p.className = 'title';
    p.textContent = username;
    name.className = 'title';
    badge.className = 'secondary-content';
    li.appendChild(img);
    li.appendChild(name);
    li.appendChild(p);
    li.appendChild(badge);
    return li;
}

function createNoUserConnectedView(userDiv) {
    let h6 = document.createElement('h6');
    h6.className = 'empty';
    userDiv.classList.add('center-content');
    h6.textContent = 'No Users Connected ! ';
    userDiv.appendChild(h6);
}
function emptyDiv(div) {
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
}
function getDateString(date) {
    return new Date(date).toTimeString().split(":").splice(0, 2).join(":") + ' ' + new Date(date).toDateString();
}