import firebase from 'firebase/app';
import 'firebase/database';

export default class SignalingClient {
  database: any;
  remoteUserName: string;

  constructor() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };

    // Initialize Firebase
    if (firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);

    // Get a reference to the database service
    this.database = firebase.database();

    this.remoteUserName = '';

  }

  // offerをRealtimeDatabaseに送る。SDPはjson形式でくる
  async signalOffer(sdp, roomName: string, myUserName: string, remoteUserName: string) {
    this.remoteUserName = remoteUserName;
    await this.database.ref(roomName + '/' + remoteUserName).set({
      signal: 'offer',
      sdp,
      from: myUserName
    });
  }

  // answerをRealtimeDatabaseに送る
  async signalAnswer(sdp: any, roomName: string, myUserName: string, remoteUserName: string) {
    await this.database.ref(roomName + '/' + remoteUserName).set({
      signal: 'answer',
      sdp,
      from: myUserName
    });
  }
  
  // candidateをRealtimeDatabaseに送る
  async signalCandidate(candidate: any, roomName: string, myUserName: string, remoteUserName: string) {
    await this.database.ref(roomName + '/' + remoteUserName).set({
      signal: 'icecandidate',
      candidate,
      from: myUserName
    });
  }

  // roomuserに自分のユーザー名を入れる
  async registerUser(roomName: string, myUserName: string) {
    // TODO 流石にuserNameの中にuserNameはあれなので入れた日にちとかにしとく
    await this.database.ref(roomName + '/roomuser/' + myUserName).set({
      myUserName
    });
  }
}
