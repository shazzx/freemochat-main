import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { MdPhone } from 'react-icons/md'
import { endCall } from '@/app/features/user/callSlice'
import { toast } from 'react-toastify'

function AudioCallRecepient({ recepientDetails }) {
    const { socket } = useAppSelector((state) => state.socket)
    const dispatch = useAppDispatch()

    useEffect(() => {
        socket.on("call-decline", (data) => {
            toast.info("Call declined")
            dispatch(endCall())
        })

        return () => {
            socket.off("call-decline");
        }
    }, [])

    const { user } = useAppSelector((state) => state.user)

    const callDecline = () => {
        socket.emit('call-decline', { recepientDetails })
        dispatch(endCall())
    }

    const callAccept = () => {
        socket.emit('call-accept', {
            type: "AUDIO", recepientDetails, userDetails: {
                userId: user._id,
                username: user.username,
                fullname: user.firstname + " " + user?.lastname,
                profile: user?.profile
            }
        })
    }

    return (
        <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute backdrop-blur-[1.5px] w-screen h-screen'>

            </div>
            <div className='w-full sm:max-w-[420px] border-2 border-accent z-10 h-full sm:max-h-[80%] py-40 flex flex-col items-center rounded-md gap-12 bg-dark overflow-hidden'>
                <div className='flex flex-col gap-2 items-center justify-center'>
                    <div className='w-28 h-28 border-2 border-accent rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        <Avatar className="flex  items-center justify-center">
                            <AvatarImage src={recepientDetails?.profile} alt="Avatar" />
                            <AvatarFallback className='text-4xl'>{recepientDetails?.fullname[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className='flex flex-col  items-center justify-center'>
                        <span className='text-lg'>{recepientDetails?.fullname}</span>
                        <span>@{recepientDetails?.username}</span>
                    </div>
                </div>
                <div >
                    <span>Calling...</span>
                </div>
                <div className="flex gap-12 absolute bottom-32">
                    <Button type="button" className="rounded-full p-4 bg-red-500 hover:bg-red-400 active:bg-red-600" onClick={callDecline}>
                        <MdPhone size={32} color="white" />
                    </Button>

                    <Button className="rounded-full p-4 bg-green-500 hover:bg-green-400 active:bg-green-600" type="button" onClick={callAccept} >
                        <MdPhone size={32} color="white" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AudioCallRecepient