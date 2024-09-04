const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
});

const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};


navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);

  myPeer.on('call', call => {
    console.log('Received call from:', call.peer);
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      console.log('Received stream from:', call.peer);
      addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      console.log('Call with', call.peer, 'closed');
      video.remove();
    });
  });

  socket.on('user-connected', userId => {
    console.log("New user connected...");
    setTimeout(() => connectToNewUser(userId, stream), 1000);
  });

  socket.on('user-disconnected', userId => {
    console.log('User disconnected:', userId);
    if (peers[userId]) peers[userId].close();
  });
});

// Handle peer ID on open
myPeer.on('open', id => {
  console.log('My peer ID is:', id);
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  console.log('Connecting to user:', userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    console.log('Connected to user:', userId);
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    console.log('Connection with', userId, 'closed');
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  console.log('Adding video stream:', stream);
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    console.log('Playing video stream');
    video.play().catch(error => {
      console.error('Error playing video:', error);
    });
  });
  videoGrid.append(video);
}