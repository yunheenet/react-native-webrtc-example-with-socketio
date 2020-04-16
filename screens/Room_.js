import React, {useState, useEffect, useRef} from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Alert,
} from 'react-native';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';

import {gql} from 'apollo-boost';
import {useMutation} from '@apollo/react-hooks';
import socketio from 'socket.io-client';

// const POST_BOOK = gql`
//   mutation postBook($bookId: String!) {
//     postBook(bookId: $bookId) {
//       ...BookParts
//       user {
//         id
//         avatar
//         username
//       }
//     }
//   }
//   ${BOOK_FRAGMENT}
// `;

const CREATE_ROOM = gql`
  mutation postRoom {
    postRoom {
      id
    }
  }
`;

//const App: () => React$Node = () => {
export default ({route}) => {
  const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};

  const [createRoomMutation] = useMutation(CREATE_ROOM);

  const roomId = useRef(route.params.roomId);
  const socket = useRef(null);
  const isInitiator = useRef(false);
  const isChannelReady = useRef(false);
  const isStarted = useRef(false);
  const pc = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // const state = route.params.state;

  useEffect(() => {
    async function initialize() {
      if (roomId.current === null || roomId.current === undefined) {
        const {data} = await createRoomMutation();
        roomId.current = data.postRoom.id;
        console.log('Create Room id : ', roomId.current);
      } else {
        console.log('Join Room id : ', roomId.current);
      }

      socket.current = socketio.connect('http://52.78.57.71:4000/');

      // Received from signalling server
      socket.current.on('created', function(room, clientId) {
        console.log('Created room ' + room);
        isInitiator.current = true;
      });

      socket.current.on('full', function(room) {
        console.log('Room ' + room + ' is full');
      });

      socket.current.on('join', function(room) {
        console.log('Another peer made a request to join room ' + room);
        console.log('This peer is the initiator of room ' + room + '!');
        isChannelReady.current = true;
      });

      socket.current.on('joined', function(room, clientId) {
        console.log('joined: ' + room);
        isChannelReady.current = true;
      });

      socket.current.on('log', function(array) {
        console.log.apply(console, array);
      });

      socket.current.on('message', function(message) {
        console.log('Client received message:', message);
        if (message === 'got user media') {
          maybeStart();
        } else if (message.type === 'offer') {
          if (!isInitiator.current && !isStarted.current) {
            maybeStart();
          }
          pc.current.setRemoteDescription(new RTCSessionDescription(message));
          doAnswer();
        } else if (message.type === 'answer' && isStarted.current) {
          pc.current.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate' && isStarted.current) {
          var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate,
          });
          pc.current.addIceCandidate(candidate);
        } else if (message === 'bye' && isStarted.current) {
          handleRemoteHangup();
        }
      });

      socket.current.emit('create or join', roomId.current);
      console.log('Attempted to create or  join room', roomId.current);

      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: 'user',
          },
        });
        gotStream(stream);
      } catch (e) {
        console.log(e);
        Alert.alert('getUserMedia() error: ' + e.name);
      }

      // mediaDevices
      //   .getUserMedia({
      //     audio: true,
      //     video: true,
      //   })
      //   .then(gotStream)
      //   .catch(function(e) {
      //     console.log(e);
      //     Alert.alert('getUserMedia() error: ' + e.name);
      //   });
    }

    initialize();

    return () => {
      console.log('Clean up.');
      socket.current.close();
    };
  }, []);

  function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.current.emit('message', message);
  }

  function gotStream(stream) {
    console.log('Adding local stream.');
    setLocalStream(stream);
    sendMessage('got user media');
    if (isInitiator.current) {
      maybeStart();
    }
  }

  function maybeStart() {
    console.log(
      '>>>>>>> maybeStart() ',
      isStarted.current,
      localStream,
      isChannelReady.current,
    );
    if (
      !isStarted.current &&
      typeof localStream !== 'undefined' &&
      isChannelReady.current
    ) {
      console.log('>>>>>> creating peer connection');
      createPeerConnection();
      pc.current.addStream(localStream);
      //isStarted.current = true;
      console.log('isInitiator', isInitiator.current);
      if (isInitiator.current) {
        doCall();
      }
    }
  }

  function createPeerConnection() {
    try {
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnection.onicecandidate = handleIceCandidate;
      peerConnection.onaddstream = handleRemoteStreamAdded;
      peerConnection.onremovestream = handleRemoteStreamRemoved;
      pc.current = peerConnection;
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
    setRemoteStream(event.stream);
    //remoteVideo.srcObject = remoteStream;
  }

  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
  }

  function doCall() {
    console.log('Sending offer to peer');
    pc.current.createOffer(setLocalAndSendMessage, handleCreateOfferError);
  }

  function doAnswer() {
    console.log('Sending answer to peer.');
    pc.current
      .createAnswer()
      .then(setLocalAndSendMessage, onCreateSessionDescriptionError);
  }

  function setLocalAndSendMessage(sessionDescription) {
    pc.current.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
  }

  function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
  }

  function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator.current = false;
  }

  function stop() {
    console.log('Stop : pc');
    isStarted.current = false;
    pc.current.close();
    pc.current = null;
  }

  return (
    <>
      <View style={{flex: 1}}>
        <View style={{backgroundColor: '#FFAAAA', flex: 1}}>
          {localStream !== null ? (
            <RTCView
              streamURL={localStream.toURL()}
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
            {remoteStream !== null ? (
              <RTCView
                streamURL={remoteStream.toURL()}
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
              <Text>RemoteStream</Text>
            )}
          </View>
        </View>
      </View>
    </>
  );
};

//export default App;
