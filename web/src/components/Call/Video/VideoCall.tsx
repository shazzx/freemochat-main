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
import { MdPhone } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";
import { endCall } from "@/app/features/user/callSlice";
import { toast } from "react-toastify";


const VideoCall = ({ cancelCall }) => {
    const { callDetails, recepientState, targetDetails } = useAppSelector((state) => state.call)
    const { user } = useAppSelector((state) => state.user)
    const { socket } = useAppSelector((state) => state.socket)


    const appId = '07c0c67268b84af3a73d5ccc109fd264'

    const [activeConnection, setActiveConnection] = useState(true);

    const [micOn, setMic] = useState(true);
    const [cameraOn, setCamera] = useState(true);

    const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
    const { localCameraTrack } = useLocalCameraTrack(cameraOn);

    useJoin(
        {
            appid: appId,
            channel: user._id,
            token: null,
        },
        activeConnection,
    );

    usePublish([localMicrophoneTrack, localCameraTrack]);

    const remoteUsers = useRemoteUsers();
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);

    audioTracks.forEach((track) => track.play());
    const dispatch = useAppDispatch()


    useEffect(() => {
        socket.on("call-end", () => {
            console.log('yes call ended')
            toast.info("Call declined")
            localMicrophoneTrack?.close()
            localCameraTrack?.close()
            cancelCall()
        })

        return () => {
            socket.off("call-end")
        }
    })

    const callDecline = () => {
        socket.emit('call-decline', { recepientDetails: callDetails.userDetails })
        cancelCall()
    }

    const callAccept = () => {
        socket.emit('call-accept', {
            type: "VIDEO", recepientDetails: callDetails.userDetails, userDetails: {
                userId: user._id,
                username: user.username,
                fullname: user.firstname + " " + user?.lastname,
                profile: user?.profile
            }
        })
    }

    return (
        <div className="mainContainer absolute left-0 top-0 overflow-hidden flex items-center justify-center z-50">
            {targetDetails ?
                <div className="flex gap-12 absolute bottom-12 z-30">
                    <button className="rounded-full p-[14px] bg-red-500 hover:bg-red-400 active:bg-red-600"
                        onClick={() => {
                            setActiveConnection(false)
                            socket.emit("call-end", { userDetails: user, recepientDetails: targetDetails })
                            cancelCall()
                        }}>
                        <MdPhone size={32} color="white" />
                    </button>
                </div> :
                <div className="flex gap-12 absolute bottom-32 z-30">
                    <Button type="button" className="rounded-full p-4 bg-red-500 hover:bg-red-400 active:bg-red-600" onClick={async () => {
                        setActiveConnection(false)
                        socket.emit("call-end", callDetails)
                        cancelCall("VIDEO")
                    }}>
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
                                <AvatarImage src={callDetails?.userDetails?.profile || targetDetails?.profile} alt="Avatar" />
                                <AvatarFallback className='text-4xl'>{callDetails?.userDetails?.fullname[0]?.toUpperCase() || targetDetails?.fullname[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className='flex flex-col  items-center justify-center'>
                            <span className='text-lg text-white'>{callDetails?.userDetails?.fullname || targetDetails?.fullname}</span>
                            <span className="text-white">@{callDetails?.userDetails?.username || targetDetails?.username}</span>
                        </div>
                        <div >
                            <span className="text-white">{recepientState || "Calling"}...</span>
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

export default VideoCall