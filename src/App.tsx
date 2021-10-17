import React, {useState, useRef, MutableRefObject} from 'react';
import InputRoomName from './components/InputRoomName';
import InputUserName from './components/InputUserName';
import Video from './components/Video';
import VideoRemote from './components/VideoRemote';
import VideoRemoteTwo from './components/VideoRemoteTwo';
import VideoRemoteThree from './components/VideoRemoteThree';
import PeerManage from './webrtc/PeerManage';
import Grid from '@material-ui/core/Grid';

type RefType = MutableRefObject<HTMLVideoElement>;

function App() {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  // TODO TEST
  const [myVideoStream, setMyVideoStream] = useState();

  // WebRtc設定を行うインスタンスを生成
  const remoteVideoRef = useRef<HTMLVideoElement>(null) as RefType;
  const remoteVideoRefTwo = useRef<HTMLVideoElement>(null) as RefType;
  const remoteVideoRefThree = useRef<HTMLVideoElement>(null) as RefType;

  const peerManage = new PeerManage(remoteVideoRef, remoteVideoRefTwo, remoteVideoRefThree, myVideoStream);

  return (
    <>
      <InputRoomName peerManage={peerManage} roomName={roomName} setRoomName={setRoomName} />
      <InputUserName peerManage={peerManage} roomName={roomName} userName={userName} setUserName={setUserName} />
      <Grid container>
        <Grid container item xs={6} justifyContent="flex-end" >
          <Video setMyVideoStream={setMyVideoStream} roomName={roomName} userName={userName} />
        </Grid>
        <Grid item xs={6} >
          <VideoRemote peerManage={peerManage} />
        </Grid>
      </Grid>
      <Grid container>
        <Grid container item xs={6} justifyContent="flex-end" >
          <VideoRemoteTwo peerManage={peerManage} />
        </Grid>
        <Grid container item xs={6}>
          <VideoRemoteThree peerManage={peerManage} />
        </Grid>
      </Grid>
    </>
  );
}

export default App;
