import AgoraRTC, { AgoraRTCProvider, useRTCClient } from 'agora-rtc-react';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

function Agora({ channel, callDetails, cancelCall, Call }: any) {

  try {
    const agoraClient = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
    console.log(channel, " : channel", callDetails, " : call details")

    useEffect(() => {
      agoraClient.on('user-left', (state) => {
        console.log('Connection state user left:', state);
        toast.info("User disconnected might be network issue")
      });

      agoraClient.on('user-joined', (state) => {
        console.log('Connection state user joined:', state);
      });

      return () => {
        agoraClient.unpublish()
      };
    }, [])

    return (
      <AgoraRTCProvider client={agoraClient}>
        <Call channel={channel} callDetails={callDetails} cancelCall={cancelCall} />
      </AgoraRTCProvider>
    )
  } catch (error) {
    console.log(error)
    return null
  }
}

export default Agora
