
import AgoraRTC, { AgoraRTCProvider, useRTCClient } from 'agora-rtc-react';
import { AgoraAudio } from './Audio';

function Agora({channel, callDetails}) {
  const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })); // Initialize Agora Client
console.log(channel)
  return (
  <AgoraRTCProvider client={agoraClient}>
    <AgoraAudio channel={channel} callDetails={callDetails} />
  </AgoraRTCProvider>
  )
}

export default Agora
