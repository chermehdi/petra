/**
 * For the application to work the hosts should install a plugin called
 *  < Screen Capturing >
 * @type {Element}
 * @authors {MaxHeap, RimasBen}
 */

// let requestButton = document.getElementById('feed');
// let connectButton = document.getElementById('connect');
let name = document.getElementById('username').textContent;
let video = document.getElementById('video');

let userList = new Set();
let localStream;
let peerConnection = null;
let candidate = null;
let isCaller = false;

let sdpConstraints = {
    'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
    }
};

socket.emit('new_rtc_admin', {name: name});

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(null);
        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.onaddstream = handleRemoteStreamAdded;
        peerConnection.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function handleIceCandidate(event) {
    console.log('handleIceCandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    if (isCaller) {
        video.src = window.URL.createObjectURL(event.stream);
        remoteStream = event.stream;
    }
}
function updateList() {
    for (let name of userList) {
        let div = document.createElement('div');
        div.className = 'list-group-item';
        div.textContent = name;
        list.appendChild(div);
    }
}

function call() {
    console.log('Sending offer to peer');
    peerConnection.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}
function handleCreateOfferError(event) {
    console.log('createOffer() error: ', e);
}

function sendMessage(message) {
    console.log('sending message to the server ', message, ' to the user ', to.value);
    socket.emit('rtc', {to: to, content: message})
}

function answer() {
    console.log('Sending answer to peer.');
    peerConnection.createAnswer(setLocalAndSendMessage, function () {
        console.log('error while creating answoer');
    }, sdpConstraints);
}
function setLocalAndSendMessage(sessionDescription) {
    peerConnection.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}
function startConversation(callback) {
    getScreenId(function (error, sourceId, screen_constraints) {
        // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
        // sourceId == null || 'string' || 'firefox'

        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(screen_constraints, function (stream) {
            //document.querySelector('video').src = URL.createObjectURL(stream);
            // share this "MediaStream" object using RTCPeerConnection API
            localStream = stream;
            callback(stream);
        }, function (error) {
            console.error(error);
        });
    });
    /*getUserMedia({video: true}, (stream) => {
     localStream = stream;
     callback(stream);
     }, (err) => {
     console.log('cant get stream object ');
     })*/
}
socket.on('rtc', (message) => {
    console.log('received from the server attempt to call ', message);
    if (message.type === 'offer') {
        startConversation(function (stream) {
            if (!peerConnection)
                createPeerConnection();
            peerConnection.addStream(stream);
            console.log('trying to answer the caller ...');
            peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            answer();
        });
    } else if (message.type === 'candidate') {
        candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        peerConnection.addIceCandidate(candidate);
    }
})
socket.on('rtc-answer', (message) => {
    console.log('rtc answer ', message);
    peerConnection.setRemoteDescription(new RTCSessionDescription(message));
})

/**
 * socket stuff
 */
socket.on('user-list', (data) => {
    for (let i of data.list) {
        userList.add(i);
    }
    updateList();
})




// requestButton.addEventListener('click', (e) => {
//     getUserMedia({video: true}, (stream) => {
//         createPeerConnection();
//         isCaller = true;
//         peerConnection.addStream(stream);
//         call();
//     }, (err) => {
//         console.log('could notget user media');
//     })
// })
