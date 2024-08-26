import AgoraRTC, { AgoraRTCProvider, useRTCClient } from 'agora-rtc-react';
import AudioCall from '../Audio/AudioCall';

function Agora({channel, callDetails, cancelCall, Call, type}) {
  try {
    const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
    console.log(channel, " : channel", callDetails, " : call details")
    return (
      <AgoraRTCProvider client={agoraClient}>
        <Call channel={channel} callDetails={callDetails} type={type} cancelCall={cancelCall} /> 
      </AgoraRTCProvider>
      )
  } catch (error) {
    console.log(error)
    return null    
  }
}

export default Agora
