import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
} from "agora-rtc-react";


export const LiveVideo = () => {

  const appId = '07c0c67268b84af3a73d5ccc109fd264'


  
  const { channelName } = useParams() 

  
  const [activeConnection, setActiveConnection] = useState(true);

  
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);

  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  
  const navigate = useNavigate()

  
  useJoin(
    {
      appid: appId,
      channel: channelName!,
      token: null,
    },
    activeConnection,
  );

  usePublish([localMicrophoneTrack, localCameraTrack]);

  
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  
  audioTracks.forEach((track) => track.play());

  useEffect(() => {
    console.log(localMicrophoneTrack, localCameraTrack)
  }, [localMicrophoneTrack, localCameraTrack])

  return (
    <>
      <div id='remoteVideoGrid'>
        {
          remoteUsers.map((user) => {
            console.log(user)
            return (
              <div key={user.uid} className="remote-video-container">
                <RemoteUser user={user} />
              </div>
            )
          }
          )
        }
      </div>
      <div id='localVideo'>
        <div>hello</div>
        <LocalUser
          audioTrack={localMicrophoneTrack}
          videoTrack={localCameraTrack}
          cameraOn={true}
          micOn={true}
          playAudio={true}
          playVideo={true}
          className=''
        />
        <div>
          <div id="controlsToolbar">
            <div id="mediaControls">
              <button className="btn" onClick={() => setMic(a => !a)}>
                Mic
              </button>
              <button className="btn" onClick={() => setCamera(a => !a)}>
                Camera
              </button>
            </div>
            <button id="endConnection"
              onClick={() => {
                setActiveConnection(false)
                navigate('/')
              }}> Disconnect
            </button>
          </div>
        </div>
      </div>
    </>
  )
}