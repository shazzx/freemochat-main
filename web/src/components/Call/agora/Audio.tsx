import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
import { useAppSelector } from "@/app/hooks";


export const AgoraAudio = ({ channel, callDetails }) => {
  console.log(callDetails)

  const appId = 'f41145d4d6fa4a3caab3104ac89622ec'

  const [activeConnection, setActiveConnection] = useState(true);

  const [micOn, setMic] = useState(true);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

  const navigate = useNavigate()

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

  useEffect(() => {
    console.log(localMicrophoneTrack)
  }, [localMicrophoneTrack])

  const { user } = useAppSelector(state => state.user)
  console.log(user)

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
            <div className='flex flex-col gap-2 items-center justify-center'>
              <div className='w-28 h-28 border-2 border-accent rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                <Avatar className="flex  items-center justify-center">
                  <AvatarImage src={callDetails?.recepientDetails?.profile} alt="Avatar" />
                  <AvatarFallback className='text-4xl'>{callDetails?.recepientDetails?.firstname[0]?.toUpperCase() + callDetails?.recepientDetails?.lastname[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className='flex flex-col  items-center justify-center'>
                <span className='text-lg'>{callDetails?.recepientDetails?.firstname?.toUpperCase() + " " + callDetails?.recepientDetails?.lastname?.toUpperCase()}</span>
                <span>@{callDetails?.recepientDetails?.username}</span>
              </div>
            </div>
            <div >
              <span>Calling...</span>
            </div>  <button
              onClick={() => {
                setActiveConnection(false)
                navigate('/')
              }}>
              <MdPhone size={32} color="red" />
            </button>
            <button className="btn" onClick={() => setMic(a => !a)}>
              <Mic color="red" size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}