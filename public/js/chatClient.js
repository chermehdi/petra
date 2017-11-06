let name = document.getElementById('username').value.trim();
let textArea = document.getElementById('message');
let send = document.getElementById('send');
let chatMessages = document.getElementById('messages-panel');
let chatPanel = document.getElementById('chat-panel');
let userInput = document.getElementById('usr-input');
var sendButton = document.getElementById('send');
let destUser = undefined;
let debug = undefined;
/**
 * Socket Io Stuff
 */
let socket = io.connect();
let active = "";
console.log('emiting new student event ', name);
socket.emit('new_student', {name: name});
socket.emit('get_conversation_student', {from: name});

/**
 * add a notification to the conversation with the user whose name is actifName
 * @param actifName
 */

function addNotification(actifName) {
    let connectedUsers = document.querySelectorAll('.list-group-item');
    for (let i = 0; i < connectedUsers.length; i++) {
        if (connectedUsers[i].childNodes[1].textContent === actifName) {
            if (connectedUsers[i].childNodes.length === 3) { // has the span
                connectedUsers[i].childNodes[2].textContent = parseInt(connectedUsers[i].childNodes[2].textContent.trim()) + 1;
            } else { // does not have the span
                let span = document.createElement('span');
                span.className = "badge not";
                span.textContent = "" + 1;
                connectedUsers[i].appendChild(span);
            }
            return false;
        }
    }
}

socket.on('new_message_student', (data) => {
    let newMessage = createMessage(data.body, 'received-message', data.from, getDateString(data.date));
    if (noMessagesBefore()) {
        emptyDiv(chatMessages);
        chatMessages.classList.remove('center-content');
    }
    addNewMessage(newMessage);
});

/**
 * loading the conversation of the target
 * @param target anchor tag
 */
function loadUserConversation(anchor) {
    let currentUser = document.querySelector('.actif .usr-name').textContent;
    destUser = currentUser;
    // Send Request To Socket to load connversations
    socket.emit('get_conversation', {to: destUser, from: name});
    // Mark the current User as the global current user ?
    console.log('send a message from ' + name + ' to ' + destUser);
}
socket.on('messages_list', (data) => {
    if (data.list.length === 0) {
        return false;
    }

    emptyDiv(chatMessages);
    chatMessages.classList.remove('center-content');

    let arr = data.list;
    let start = arr.length > 10  ? arr.length - 10: 0;

    for (let i = start; i < arr.length; i++) {
        let className = arr[i].sender === name ? 'sended-message' : 'received-message';
        let message = createMessage(arr[i].body, className, arr[i].sender, getDateString(arr[i].date));
        addNewMessage(message, true);
    }
});

/**
 * Chat Messages Handling
 */
userInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
        if (noMessagesBefore()) {
            emptyDiv(chatMessages);
            chatMessages.classList.remove('center-content');
            chatMessages.classList.remove('verticaly');
            let container = document.createElement('div');
            container.className = 'container';
            container.id = 'messages-container';
            chatMessages.appendChild(container);
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
function addNewMessage(current, fast) {
    let container = document.getElementById('messages-container');
    if(!container) {
        container = document.createElement('div');
        container.className = 'container';
        container.id = 'messages-container';
        chatMessages.appendChild(container);
    }
    container.appendChild(current);
    let duration = fast ? 50 : 500;
    $(chatMessages).animate({scrollTop: $(chatMessages).prop("scrollHeight")}, duration);
}

function sendMessage(message) {
    // only execute this method if a destination user is defined

    // Display the message in the UI
    let currentDate = new Date();
    let current = createMessage(message, 'sended-message', name, currentDate.toTimeString());
    addNewMessage(current);
    // Send The message to the receiver
    if (!name || name === "") {
        console.error('the name is empty why ? ');
    }

    let objectToSend = {
        from: name,
        body: message,
        date: currentDate
    };

    socket.emit('new_message_student', objectToSend);

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
        messageContainer = document.createElement('div'),
        messageHeader = document.createElement('p'),
        messageBody = document.createElement('p');
    row.className = 'row';
    col.className = (className === 'received-message' ? 'col s8' : 'col s8 offset-s4');;
    messageContainer.className = className;
    messageHeader.className = 'message-header';
    messageBody.className = 'message-content';
    messageContainer.appendChild(messageHeader);
    messageContainer.appendChild(messageBody);
    messageHeader.textContent = username;
    messageBody.textContent = str;
    col.appendChild(messageContainer);
    row.appendChild(col);
    return row;
}

function emptyDiv(div) {
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }
}
function getDateString(date) {
    return new Date(date).toTimeString().split(":").splice(0, 2).join(":") + ' ' + new Date(date).toDateString();
}