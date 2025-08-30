import { useEffect, useState } from "react";

import {
    LocalUser,
    RemoteUser,
    useJoin,
    useLocalCameraTrack,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteAudioTracks,
    useRemoteUsers,
    useRTCClient,
} from "agora-rtc-react";
import { MdPhone } from "react-icons/md";
import { useAppSelector } from "@/app/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";
import { join } from "path";
import CallSecondsCounter from "../CallSecondsCounter";


const VideoCallAccepted = ({ channel, _callDetails, cancelCall }) => {
    const { callDetails, callerState, onCall, recepientState, isMobile, targetDetails, type } = useAppSelector((state) => state.call)
    const { user } = useAppSelector((state) => state.user)
    const { socket } = useAppSelector((state) => state.socket)

    useEffect(() => {
        socket.on("call-end", (data) => {
            console.log('call end', data)
            setActiveConnection(false)
            cancelCall("VIDEO")
        })
    })

    const appId = '07c0c67268b84af3a73d5ccc109fd264'


    const remoteUsers = useRemoteUsers();
    const [activeConnection, setActiveConnection] = useState(true);

    const [micOn, setMic] = useState(true);
    const [cameraOn, setCamera] = useState(true);

    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);

    useJoin(
        {
            appid: appId,
            channel: callDetails.channel,
            token: null,
        },
        activeConnection,
    );

    usePublish([localMicrophoneTrack, localCameraTrack]);

    const { audioTracks } = useRemoteAudioTracks(remoteUsers);
    audioTracks.forEach((track) => track.play());

    useEffect(() => {
        console.log(localMicrophoneTrack, localCameraTrack)
    }, [localMicrophoneTrack, localCameraTrack])
    const callDecline = () => {
        socket.emit('call-decline', {
            recepientDetails: callDetails.userDetails, userDetails: {
                userId: user._id,
                username: user.username,
                fullname: user.firstname + " " + user?.lastname,
                profile: user?.profile
            }
        })
        localCameraTrack.stop()
        localCameraTrack.close()
        localMicrophoneTrack.close()
        localMicrophoneTrack.stop()
    }
    console.log(callDetails)

    useEffect(() => {
        socket.on("call-end", (data) => {
            console.log('call end', data)
            setActiveConnection(false)
            localCameraTrack.stop()
            localCameraTrack.close()
            localMicrophoneTrack.close()
            localMicrophoneTrack.stop()
            cancelCall("VIDEO")
        })

        return () => {
            socket.off("call-end")
        }
    })

    const callAccept = () => {
        socket.emit('call-accept', {
            type: "VIDEO", recepientDetails: callDetails.userDetails, userDetails: {
                userId: user._id,
                username: user.username,
                fullname: user.firstname + " " + user?.lastname,
                profile: user?.profile
            },
            isMobile
        })
    }

    return (
        <div className="mainContainer absolute left-0 top-0 overflow-hidden flex items-center justify-center z-50">
            {recepientState == 'ACCEPTED' || callDetails?.recepientDetails.username !== user.username ?
                <div className="flex gap-12 absolute bottom-12 z-30">
                    <button className="rounded-full p-[14px] bg-red-500 hover:bg-red-400 active:bg-red-600"
                        onClick={async () => {
                            setActiveConnection(false)
                            socket.emit("call-end", {
                                ...callDetails, userDetails: {
                                    userId: user._id,
                                    username: user.username,
                                    fullname: user.firstname + " " + user?.lastname,
                                    profile: user?.profile
                                }
                            })
                            localCameraTrack.stop()
                            localCameraTrack.close()
                            localMicrophoneTrack.close()
                            localMicrophoneTrack.stop()
                            cancelCall("VIDEO")
                        }}>
                        <MdPhone size={32} color="white" />
                    </button>

                </div>
                :
                <div className="flex gap-12 absolute bottom-20 z-10">
                    <Button type="button" className="rounded-full p-4 bg-red-500 hover:bg-red-400 active:bg-red-600" onClick={callDecline}>
                        <MdPhone size={32} color="white" />
                    </Button>

                    <Button className="rounded-full p-4 bg-green-500 hover:bg-green-400 active:bg-green-600" type="button" onClick={callAccept} >
                        <MdPhone size={32} color="white" />
                    </Button>
                </div>
            }
            <div className="remoteVideoContainer">
                {
                    remoteUsers.map((user) => {
                        return (
                            <div key={user.uid} className={isMobile ? "remote-video-container-mobile" : "remote-video-container"}>
                                <div className="absolute top-3 right-3 p-2 rounded-sm z-50">
                                    <CallSecondsCounter isCallActive={true} key={callDetails.userId} />
                                </div>
                                <RemoteUser allowFullScreen={true} playVideo={true} user={user} />
                            </div>
                        )
                    }
                    )

                }
                {remoteUsers.length == 0 &&
                    <div className='flex flex-col gap-4 items-center justify-center'>
                        <div className='w-28 h-28 border-2 border-accent rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                            <Avatar className="flex  items-center justify-center">
                                <AvatarImage src={callDetails?.recepientDetails?.profile || targetDetails?.profile} alt="Avatar" />
                                <AvatarFallback className='text-4xl'>{callDetails?.recepientDetails?.fullname[0]?.toUpperCase() || targetDetails?.fullname[0]?.toUpperCase() || callDetails?.recepientDetails?.fullname[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className='flex flex-col  items-center justify-center'>
                            <span className='text-lg text-white'>{callDetails?.recepientDetails?.fullname || targetDetails?.fullname}</span>
                            <span className="text-white">@{callDetails?.recepientDetails?.username || targetDetails?.username}</span>
                        </div>
                    </div>
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
                </div>
            </div>
        </div>
    )
}

export default VideoCallAccepted