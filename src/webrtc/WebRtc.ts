import { MutableRefObject } from "react";
import SignalingClient from "./SignalingClient";

type MyStreamType = HTMLVideoElement | HTMLCanvasElement;
type RefType = MutableRefObject<HTMLVideoElement> | null;

export default class WebRtc {
  roomName: string;
  myUserName: string;
  remoteUserName: string;
  rtcPeerConnection: RTCPeerConnection;
  signalingClient: SignalingClient;
  mediaStream: MediaStream;
  remoteVideoRef: RefType;

  constructor(remoteVideoRef: RefType) {
    // urlsには公開されているstunserverを設定する
    // stunserver：外部から見た自PCのIPアドレスを返してくれるもの
    const config = {
      iceServers: [{ urls: "stun:stun4.l.google.com:19302" }]
    }
    this.rtcPeerConnection = new RTCPeerConnection(config);

    // シグナリングサーバーとやりとりするために必要
    this.signalingClient = new SignalingClient();

    // 入室する部屋名
    this.roomName = '';
    // 自分の名前
    this.myUserName = '';
    // リモートの名前
    this.remoteUserName = '';

    // Localのメディアストリーム
    this.mediaStream = new MediaStream();

    // remoteVideo用のRef
    this.remoteVideoRef = remoteVideoRef;
  }

  // 自分のmediaStreamとTrackを設定する
  async setLocalMediaStream(myVideoStream: MediaStream) {
    // mediaStreamを取得する
    const constraints = { audio: true, video: true };
    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    // audioTrackを設定する
    // this.audioTrack.enabled = false;
    this.rtcPeerConnection.addTrack(this.mediaStream.getAudioTracks()[0], this.mediaStream);

    // videoTrackを設定する
    if(myVideoStream) {
      this.rtcPeerConnection.addTrack(myVideoStream.getVideoTracks()[0], this.mediaStream);
    } else {
      this.rtcPeerConnection.addTrack(this.mediaStream.getVideoTracks()[0], this.mediaStream);
    }
  }

  setRoomName(roomName: string) {
    this.roomName = roomName;
  }
  
  // onicecandidateにコールバック関数を設定し、candidate設定時にRealtimeDatabaseに通知するようにする
  setOnicecandidateCallback() {
    // candidateには自分の通信経路が入ってくる
    this.rtcPeerConnection.onicecandidate = async ({candidate}) => {
      if(candidate) {
        // remoteへfirebaseを通してcandidateを通知する
        await this.signalingClient.signalCandidate(candidate.toJSON(),
        this.roomName, this.myUserName, this.remoteUserName);
      }
    }
  }

  // onsettrackにtrack設定時のコールバック関数を設定する
  setOntrack() {
    // 相手のtrackが設定された際に動くコールバック関数
    this.rtcPeerConnection.ontrack = (rtcTrackEvent) => {
      if (rtcTrackEvent.track.kind !== 'video') return;
      // 相手のstreamを設定する
      const remoteMediaStream = rtcTrackEvent.streams[0];
      console.log(this.remoteVideoRef);
      console.log(this.remoteVideoRef?.current)
      this.remoteVideoRef!.current.srcObject = remoteMediaStream;
    };
  }

  // rtcPeerConnectionのcreateOfferにてSDPを取得する
  async createMySdp() {
    try {
      return await this.rtcPeerConnection.createOffer();
    } catch (e) {
      console.error(e)
    }
  }

  // rtcPeerConnectionのsetLocalDescriptionにて自分のSDPを設定する
  async setLocalSdp(sessionDescription: any) {
    try{
      await this.rtcPeerConnection.setLocalDescription(sessionDescription);
    }catch(e) {
      console.error(e);
    }
  }

  // rtcPeerConnectionのsetRemoteDescriptionにて相手のSDPを設定する
  async setRemoteSdp(remoteSdp: any) {
    try{
      console.log(remoteSdp)
      await this.rtcPeerConnection.setRemoteDescription(remoteSdp);
    } catch(e) {
      console.error(e);
    }
  }

  // offerシグナルを実際にRealtimeDatabaseに送る
  async sendOffer() {
    // offerをRealtimeDatabaseに送る。SDPはJSONにする
    await this.signalingClient.signalOffer(this.rtcPeerConnection.localDescription!.toJSON(),
      this.roomName, this.myUserName, this.remoteUserName);
  }

  // 自分の名前を入力した後、offerシグナルを送信する
  async offer(myUserName: string, remoteUserName: string, roomName: string) {
    this.myUserName = myUserName;
    this.remoteUserName = remoteUserName;
    this.roomName = roomName;

    // onicecandidateにコールバック関数を設定し、candidate設定時にRealtimeDatabaseに通知するようにする
    this.setOnicecandidateCallback();

    // onsettrackにtrack設定時のコールバック関数を設定する
    this.setOntrack();

    // SDPを取得、設定
    const sessionDescription = await this.createMySdp();
    await this.setLocalSdp(sessionDescription);

    // 実際にofferをRealtimeDatabaseに送る
    await this.sendOffer();
  }

  // offerを受け取った時、answerシグナルを送信する
  async answer(sdp: any, roomName: string, myUserName: string, remoteUserName: string) {
    this.myUserName = myUserName;

    // answer受け取った人から見ればoffer送った人がremoteの人
    this.remoteUserName = remoteUserName;
    this.roomName = roomName;

    try {
      // onicecandidateにコールバック関数を設定し、candidate設定時にRealtimeDatabaseに通知するようにする
      this.setOnicecandidateCallback();

      // onsettrackにtrack設定時のコールバック関数を設定する
      this.setOntrack();

      // offerを送ってきた相手(remoteUser)のsdpを設定する
      await this.rtcPeerConnection.setRemoteDescription(sdp);

      // rtcPeerConnectionからanswerを作成
      const answer = await this.rtcPeerConnection.createAnswer();

      // 自分のSDPをrtcPeerConnectionに設定する
      await this.rtcPeerConnection.setLocalDescription(answer);

      // TODO offerと揃える(sendAnswerを作った方が書き方そろっている)
      // answerを送信する
      await this.signalingClient.signalAnswer(this.rtcPeerConnection.localDescription!.toJSON(),
        this.roomName, this.myUserName, this.remoteUserName);

    } catch(e) {
      console.error(e);
    }
  }
}