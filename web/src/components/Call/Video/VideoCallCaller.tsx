import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect } from 'react'
import { useAppSelector } from '@/app/hooks'
import { Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'

function VideoCallCaller({ recepientDetails, setVideoCallCallerState }) {
    const { socket } = useAppSelector((state) => state.socket) as { socket: Socket }

    useEffect(() => {

        socket.on("call-decline", (data) => {
            setVideoCallCallerState(false)
        })

        return () => {
            socket.off("connect");
            socket.off("call-decline");
        }
    }, [])

    
const cancelCall = () => {
    socket.emit('call-cancel', {recepientDetails})
    setVideoCallCallerState(false)
}
    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center'>
            <div className='w-full z-10 h-full py-40 flex flex-col items-center rounded-md gap-12 bg-card overflow-hidden'>
                <div className='flex flex-col gap-2 items-center justify-center'>
                    <div className='w-28 h-28 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        <Avatar className="flex items-center justify-center">
                            <AvatarImage src={recepientDetails?.images?.profile} alt="Avatar" />
                            <AvatarFallback className='text-4xl'>{recepientDetails?.firstname[0]?.toUpperCase() + recepientDetails?.lastname[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className='flex flex-col  items-center justify-center'>
                        <span className='text-lg'>{recepientDetails?.firstname?.toUpperCase() + " " + recepientDetails?.lastname?.toUpperCase()}</span>
                        <span>@{recepientDetails?.username}</span>
                    </div>
                </div>
                <div >
                    <span>Calling...</span>
                </div>
                <div className='flex gap-2'>
                    <Button onClick={cancelCall} className='bg-destructive hover:bg-red-800 cursor-pointer'>Cancel</Button>
                </div>
            </div>
        </div>
    )
}

export default VideoCallCaller