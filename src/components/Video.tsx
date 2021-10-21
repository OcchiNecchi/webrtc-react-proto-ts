import React, {useEffect, useRef, MutableRefObject} from 'react';
import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    minWidth: 640,
    maxWidth: 640,
    padding: 0,
  },
});

interface Props {
  setMyVideoStream: any,
  roomName: string,
  userName: string
}

const Video = ({setMyVideoStream, roomName, userName}: Props) => {
  const classes = useStyles();

  // TODO リファクタ対象
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let contineuAnimation = true;
  let bodyPixMaks: any = null;
  let canvasStream = null;
  let bodyPixNet: any = null;
  // 何ミリ秒に一度canvasを書き換えるか
  const segmeteUpdateTime = 30; // ms

  // 追加コード
  const startCanvasVideo = async () => {
    if(videoRef.current === null || canvasRef.current === null) return;
    
    // タグに直接autoplayだとvideoが止まってしまうため
    await videoRef.current.play().catch((err: any) => console.error('local play ERROR:', err));

    window.requestAnimationFrame(updateCanvas);
    canvasStream = canvasRef.current.captureStream();
    setMyVideoStream(canvasStream);
    updateSegment();
  }

  const updateCanvas = () => {
    drawCanvas(videoRef.current!);
    if (contineuAnimation) {
      window.requestAnimationFrame(updateCanvas);
    }
  }

  const drawCanvas = (srcElement: HTMLVideoElement) => {
    const opacity = 1.0;
    const flipHorizontal = false;
    // 下記、0じゃないとsafariでprivacy部分が透明になってしまう(body-pixのバグ？)
    const maskBlurAmount = 0; // マスクの周囲にボケ効果を入れる

    bodyPix.drawMask(
      canvasRef.current!, srcElement, bodyPixMaks, opacity, maskBlurAmount,
      flipHorizontal
    );
  }

  const updateSegment = () => {
    const option = {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
      maxDetections: 4,
      scoreThreshold: 0.5,
      nmsRadius: 20,
      minKeypointScore: 0.3,
      refineSteps: 10
    };
    bodyPixNet.segmentPerson(videoRef.current, option)
    .then((segmentation: any) => {
      const fgColor = { r: 0, g: 0, b: 0, a: 0 };
      const bgColor = { r: 127, g: 127, b: 127, a: 255 };
      const roomPartImage = bodyPix.toMask(segmentation, fgColor, bgColor);
      bodyPixMaks = roomPartImage;

      if (contineuAnimation) {
        // 次の人体セグメンテーションの実行を予約する
        setTimeout(updateSegment, segmeteUpdateTime);
      }
    })
  }

  useEffect(() => {

    const loadModel = async () => {
      const net = await bodyPix.load(/** optional arguments, see below **/);
      // console.log(net);
      bodyPixNet = net;
    }

    const doEffect = async () => {
      let mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  
      // MDNから audioとカメラの使用許可をブラウザに 与える
      if(videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        if (window.matchMedia && window.matchMedia('(max-device-width: 640px)').matches) {
          // スマホ・タブレット（iOS・Android）の場合
          setMyVideoStream(mediaStream);
        } else {
          // PCの場合
          // body-pit 
          await loadModel();
    
          // videoが読み込まれたらコールバックを実行する
          videoRef.current.onloadeddata = (e) => {
            startCanvasVideo();
          }
        }

        // if(navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i)){
        //   // スマホ・タブレット（iOS・Android）の場合
        //   setMyVideoStream(mediaStream);

        // }else{
        //   // PCの場合
        //   // body-pit 
        //   await loadModel();
    
        //   // videoが読み込まれたらコールバックを実行する
        //   videoRef.current.onloadeddata = (e) => {
        //     startCanvasVideo();
        //   }
        // }
      }
    }

    doEffect();
  }, [roomName]);

  return(
    <>
      <video muted={true} ref={videoRef} width="640px" height="480px" id="local_video" hidden/>
      <Card className={classes.root} >
        <CardContent className={classes.root} >
          <canvas ref={canvasRef} id="canvas" width="640px" height="480px" />
        </CardContent>
        <CardContent >
          <Typography color="textSecondary" gutterBottom>
            My video
          </Typography>
          <Typography variant="body2" component="p">
            {userName}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};

export default Video;