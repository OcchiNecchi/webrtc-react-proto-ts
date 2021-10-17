import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import PeerManage from '../webrtc/PeerManage';

const useStyles = makeStyles({
  root: {
    minWidth: 640,
    maxWidth: 640,
    padding: 0,
  },
});

interface Props {
  peerManage: PeerManage;
}

const VideoRemote = ({peerManage}: Props) => {
  // TODO リファクタ対象
  const videoRef = peerManage.remoteVideoRefTwo;

  const classes = useStyles();

  return(
    <>
      <Card className={classes.root} >
        <CardContent className={classes.root} >
          <video autoPlay muted={false} ref={videoRef}/>
        </CardContent>
        <CardContent >
          <Typography color="textSecondary" gutterBottom>
            Remote video
          </Typography>
          <Typography variant="body2" component="p">
            {"remote user 2"}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};

export default VideoRemote;