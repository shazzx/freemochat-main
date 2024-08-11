import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";

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
import { useSocket } from "@/hooks/useSocket";
import { Mic } from "lucide-react";
import { MdPhone } from "react-icons/md";


const VideoCall = ({ channel, callDetails, cancelCall }) => {
    console.log(callDetails)
    const socket = useSocket()

    useEffect(() => {
        socket.on("call-end", (data) => {
            console.log('call end', data)
            setActiveConnection(false)
            cancelCall("VIDEO")
        })
    })

    const appId = 'f41145d4d6fa4a3caab3104ac89622ec'

    // set the connection state
    const [activeConnection, setActiveConnection] = useState(true);

    // track the mic/video state - Turn on Mic and Camera On
    const [micOn, setMic] = useState(true);
    const [cameraOn, setCamera] = useState(true);

    // get local video and mic tracks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);

    const muteAudio = async () => {
        // Update UI to show muted state
    };

    useJoin(
        {
            appid: appId,
            channel: channel!,
            token: null,
        },
        activeConnection,
    );

    usePublish([localMicrophoneTrack, localCameraTrack]);

    //remote users
    const remoteUsers = useRemoteUsers();
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);

    // play the remote user audio tracks
    audioTracks.forEach((track) => track.play());

    useEffect(() => {
        console.log(localMicrophoneTrack, localCameraTrack)
    }, [localMicrophoneTrack, localCameraTrack])

    return (
        <div className="mainContainer absolute left-0 top-0 overflow-hidden flex items-center justify-center z-50">
            <div className="flex gap-12 absolute bottom-12 z-30">
                <button className="rounded-full p-[14px] bg-red-500 hover:bg-red-400 active:bg-red-600"
                    onClick={async () => {
                        setActiveConnection(false)
                        socket.emit("call-end", callDetails)
                        cancelCall("AUDIO")
                    }}>
                    <MdPhone size={32} color="white" />
                </button>

                <button className="rounded-full p-[14px] bg-red-500" onClick={() => setMic(a => !a)}>
                    <Mic color="white" size={32} />
                </button>
            </div>
            <div className="remoteVideoContainer">
                {
                    // Initialize each remote stream using RemoteUser component
                    remoteUsers.map((user) => {
                        return (
                            <div key={user.uid} className={isMobile ? "remote-video-container-mobile" : "remote-video-container"}>
                                <RemoteUser allowFullScreen={true} playVideo={true} user={user} />
                            </div>
                        )
                    }
                    )
                }
            </div>
            <div id='localVideo'>
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

                    {/* media-controls toolbar component - UI controling mic, camera, & connection state  */}
                    {/* <div id="controlsToolbar">
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
          </div> */}
                </div>
            </div>
        </div>
    )
}

export default VideoCall