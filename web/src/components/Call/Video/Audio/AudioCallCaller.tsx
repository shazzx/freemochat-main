import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useSocket } from '@/hooks/useSocket'

function AudioCallCaller({ recepientDetails, setAudioCallCaller }) {
    const socket = useSocket()

    useEffect(() => {

        socket.on("call-decline", (data) => {
            setAudioCallCaller(false)
        })

        return () => {
            socket.off("connect");
            socket.off("call-decline");
        }
    }, [])

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute backdrop-blur-[1.5px] w-screen h-screen' onClick={() => {
                setAudioCallCaller(false)
            }}>

            </div>
            <div className='w-full sm:max-w-[420px] border-2 border-accent z-10 h-full sm:max-h-[80%] py-40 flex flex-col items-center rounded-md gap-12 bg-dark overflow-hidden'>
                <div className='flex flex-col gap-2 items-center justify-center'>
                    <div className='w-28 h-28 border-2 border-accent rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        <Avatar className="flex  items-center justify-center">
                            <AvatarImage src={recepientDetails?.profile} alt="Avatar" />
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
                    <Button onClick={() => {
                        setAudioCallCaller(false)
                    }} className='bg-destructive hover:bg-red-800 cursor-pointer'>Cancel</Button>
                </div>
            </div>
        </div>
    )
}

export default AudioCallCaller