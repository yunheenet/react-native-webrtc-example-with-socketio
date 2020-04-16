import React, {useState, useEffect} from 'react';
import {View, Text, Alert} from 'react-native';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';

import {gql} from 'apollo-boost';
import {useMutation} from '@apollo/react-hooks';
import socketio from 'socket.io-client';

const CREATE_ROOM = gql`
  mutation postRoom {
    postRoom {
      id
    }
  }
`;

const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
let roomId = null;
let socket = null;
let isInitiator = false;
let isChannelReady = false;
let isStarted = false;
let pc = null;
let localStream = null;
let remoteStream = null;
let candidates = [];

//const App: () => React$Node = () => {
export default ({route}) => {
  roomId = route.params.roomId;

  const [createRoomMutation] = useMutation(CREATE_ROOM);

  const [localVideo, setLocalVideo] = useState(null);
  const [remoteVideo, setRemoteVideo] = useState(null);

  useEffect(() => {
    async function initialize() {
      if (roomId === null || roomId === undefined) {
        const {data} = await createRoomMutation();
        roomId = data.postRoom.id;
        console.log('Create Room id : ', roomId);
      } else {
        console.log('Join Room id : ', roomId);
      }

      socket = socketio.connect('http://52.78.57.71:4000/');

      // Received from signalling server
      socket.on('created', function(room, clientId) {
        console.log('Created room ' + room);
        isInitiator = true;
      });

      socket.on('full', function(room) {
        console.log('Room ' + room + ' is full');
      });

      socket.on('join', function(room) {
        console.log('Another peer made a request to join room ' + room);
        console.log('This peer is the initiator of room ' + room + '!');
        isChannelReady = true;
      });

      socket.on('joined', function(room, clientId) {
        console.log('joined: ' + room);
        isChannelReady = true;
      });

      socket.on('log', function(array) {
        console.log.apply(console, array);
      });

      socket.on('message', function(message) {
        console.log('Client received message:', message);
        if (message === 'got user media') {
          maybeStart();
        } else if (message.type === 'offer') {
          if (!isInitiator && !isStarted) {
            maybeStart();
          }
          pc.setRemoteDescription(new RTCSessionDescription(message));
          candidates.forEach(candidate => {
            pc.addIceCandidate(candidate);
          });
          doAnswer();
        } else if (message.type === 'answer' && isStarted) {
          pc.setRemoteDescription(new RTCSessionDescription(message));
          candidates.forEach(candidate => {
            pc.addIceCandidate(candidate);
          });
        } else if (message.type === 'candidate' && isStarted) {
          const candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            sdpMid: message.id,
            candidate: message.candidate,
          });

          try {
            if (pc.remoteDescription === 'undefined') {
              candidates.add(candidate);
            } else {
              pc.addIceCandidate(candidate);
              if (candidates.length > 0) {
                candidates.forEach(c => {
                  pc.addIceCandidate(c);
                });
              }
            }
          } catch (e) {
            console.log(
              'RemoteDescription error state :',
              pc.remoteDescription,
            );
          }
        } else if (message === 'bye' && isStarted) {
          handleRemoteHangup();
        }
      });

      socket.emit('create or join', roomId);
      console.log('Attempted to create or  join room', roomId);

      mediaDevices
        .getUserMedia({
          audio: true,
          video: {facingMode: 'user'},
        })
        .then(gotStream)
        .catch(function(e) {
          console.log(e);
          Alert.alert('getUserMedia() error: ' + e.name);
        });
    }

    initialize();

    return () => {
      hangup();
    };
  }, []);

  function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
  }

  function gotStream(stream) {
    console.log('Adding local stream.');
    setLocalVideo(stream);
    localStream = stream;
    sendMessage('got user media');
    if (isInitiator) {
      maybeStart();
    }
  }

  function maybeStart() {
    console.log(
      '>>>>>>> maybeStart() ',
      isStarted,
      localStream,
      isChannelReady,
    );
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
      console.log('>>>>>> creating peer connection');
      createPeerConnection();
      pc.addStream(localStream);
      isStarted = true;
      console.log('isInitiator', isInitiator);
      if (isInitiator) {
        doCall();
      }
    }
  }

  function createPeerConnection() {
    try {
      pc = new RTCPeerConnection(configuration);
      pc.onicecandidate = handleIceCandidate;
      pc.onaddstream = handleRemoteStreamAdded;
      pc.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      Alert.alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    } else {
      console.log('End of candidates.');
    }
  }

  function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    setRemoteVideo(event.stream);
    // remoteStream = event.stream;
    //remoteVideo.srcObject = remoteStream;
  }

  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  function handleCreateOfferError(event) {
    isChannelReady = false;
    console.log('createOffer() error: ', event);
  }

  function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer().then(setLocalAndSendMessage, handleCreateOfferError);
  }

  function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError,
    );
  }

  function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
  }

  function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
  }

  function handleRemoteHangup() {
    console.log('Session terminated.');
    //isInitiator = false;

    stop();

    resetRemoteStream();
    resetPeerConnection();
  }

  function hangup() {
    console.log('hangup');
    sendMessage('bye');

    stop();

    resetLocalStream();
    resetRemoteStream();
    resetPeerConnection();
    resetSocket();
  }

  function stop() {
    console.log('stop');
    isStarted = false;
    isChannelReady = false;
  }

  function resetSocket() {
    if (socket !== null) {
      socket.close();
      socket = null;
    }
  }

  function resetPeerConnection() {
    if (pc !== null) {
      pc.close();
      pc = null;
    }
  }

  function resetRemoteStream() {
    setRemoteVideo(null);
  }

  function resetLocalStream() {
    if (localStream !== null) {
      localStream = null;
    }
    setLocalVideo(null);
  }

  return (
    <>
      <View style={{flex: 1}}>
        <View style={{backgroundColor: '#FFAAAA', flex: 1}}>
          {localVideo !== null ? (
            <RTCView
              streamURL={localVideo.toURL()}
              mirror={true}
              style={{
                // position: 'absolute',
                zIndex: 0,
                width: '100%',
                height: '100%',
              }}
              objectFit="cover"
            />
          ) : (
            <Text>Local</Text>
          )}
        </View>
        <View style={{flexDirection: 'row', flex: 1}}>
          <View style={{backgroundColor: '#FFAA00', flex: 1}}>
            {remoteVideo !== null ? (
              <RTCView
                streamURL={remoteVideo.toURL()}
                mirror={true}
                style={{
                  // position: 'absolute',
                  zIndex: 0,
                  width: '100%',
                  height: '100%',
                }}
                objectFit="cover"
              />
            ) : (
              <Text>Remote</Text>
            )}
          </View>
        </View>
      </View>
    </>
  );
};

//export default App;
