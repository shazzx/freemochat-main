import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import { useAppSelector } from '@/app/hooks'
import { Socket } from 'socket.io-client'

function VideoCallUI({ recepientDetails, setVideoCallState }) {
    const { socket } = useAppSelector((state) => state.socket) as { socket: Socket }

    useEffect(() => {

        socket.on("call-decline", (data) => {
            console.log(data)
        })

        return () => {
            socket.off("connect");
            socket.off("call-decline");
        }
    }, [])

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute w-screen h-screen' onClick={() => {
                setVideoCallState(false)
            }}>

            </div>
            <div className='w-full h-full flex flex-col items-center justify-center rounded-md gap-4  border-primary border-2 bg-card overflow-hidden'>
                <div className='flex flex-col items-center justify-center'>
                    <div className='w-24 h-24 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        <Avatar className="flex items-center justify-center">
                            <AvatarImage src={recepientDetails?.images?.profile} alt="Avatar" />
                            <AvatarFallback className='text-4xl'>{recepientDetails?.firstname[0]?.toUpperCase() + recepientDetails?.lastname[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div>{recepientDetails?.firstname + recepientDetails?.lastname}
                    </div>
                </div>
                <div >
                    <span>Calling...</span>
                </div>
                <div className='flex gap-2'>
                    <Button className='bg-destructive'>Decline</Button>
                    <Button>Attend</Button>
                </div>
            </div>
        </div>
    )
}

export default VideoCallUI