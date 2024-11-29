import { memo, useEffect, useState } from "react";

import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
} from "agora-rtc-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Mic } from "lucide-react";
import { MdPhone } from "react-icons/md";
import CallSecondsCounter from "../CallSecondsCounter";
import { useSocket } from "@/hooks/useSocket";
import { useAppSelector } from "@/app/hooks";
import { toast } from "react-toastify";

const AudioCall = ({ channel, callDetails, cancelCall }) => {
  const recepient = callDetails.recepientDetails
  const appId = 'f41145d4d6fa4a3caab3104ac89622ec'
  const socket = useSocket()
  const { user } = useAppSelector((state) => state.user)


  const [activeConnection, setActiveConnection] = useState(true);
  const [micOn, setMic] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);


  useEffect(() => {
    socket.on("call-end", (data) => {
      console.log('call end', data)
      setActiveConnection(false)
      cancelCall("AUDIO")
    })
  })

  useJoin(
    {
      appid: appId,
      channel: channel!,
      token: null,
    },
    activeConnection,
  );

  usePublish([localMicrophoneTrack]);

  //remote users
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // play the remote user audio tracks
  audioTracks.forEach((track) => track.play());

  return (
    <div className="absolute overflow-hidden flex items-center justify-center">
      <div>
        {
          remoteUsers.map((user) => {
            console.log(user)
            return (
              <div key={user.uid} className="remote-video-container">
                <RemoteUser allowFullScreen={true} playVideo={true} user={user} />
              </div>
            )
          }
          )
        }
      </div>
      <div>
        <LocalUser
          audioTrack={localMicrophoneTrack}
          micOn={true}
          playAudio={true}
          className=''
        />

        <div className="fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center">
          <div className='absolute backdrop-blur-[1.5px] w-screen h-screen' onClick={() => {
            // setAudioCallCaller(false)
          }}>

          </div>
          <div className='w-full sm:max-w-[420px] border-2 border-accent z-10 h-full sm:max-h-[80%] py-40 flex flex-col items-center rounded-md gap-12 bg-dark overflow-hidden'>
            <div className='flex flex-col gap-4 items-center justify-center'>
              <div className='w-28 h-28 border-2 border-accent rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                <Avatar className="flex  items-center justify-center">
                  <AvatarImage src={recepient?.profile} alt="Avatar" />
                  <AvatarFallback className='text-4xl'>{recepient?.fullname[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className='flex flex-col  items-center justify-center'>
                <span className='text-lg'>{recepient?.fullname}</span>
                <span>@{recepient?.username}</span>
              </div>
            </div>
            <div >
              <CallSecondsCounter isCallActive={true} key={callDetails.userId} />
            </div>
            <div className="flex gap-12 absolute bottom-36">
              <button className="rounded-full p-[14px]  bg-red-500 hover:bg-red-400 active:bg-red-600"
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
                  cancelCall("AUDIO")
                }}>
                <MdPhone size={32} color="white" />
              </button>
              {/* 
              <button className="rounded-full p-[14px] bg-red-500" onClick={() => setMic(a => !a)}>
                <Mic color="white" size={32} />
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(AudioCall)