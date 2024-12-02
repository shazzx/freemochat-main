// import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
// import  { useEffect } from 'react'
// import { useAppSelector } from '@/app/hooks'
// import { Button } from '@/components/ui/button'
// import { toast } from 'react-toastify'

// function VideoCallRecepient({ recepientDetails, setVideoCallState}) {
//     const { socket } = useAppSelector((state) => state.socket)

//     useEffect(() => {

//         socket.on("call-decline", (data) => {
//             toast.info("Call declined rece")

//             setVideoCallState(false)
//         })

//         socket.on("call-end", (data) => {
//             setVideoCallState(false)
//         })

//         return () => {
//             socket.off("call-decline");
//             socket.off("call-end");
//         }
//     }, [])

    
// const callDecline = () => {
//     socket.emit('call-decline', {recepientDetails})
//     setVideoCallState(false)
// }

// const callAccept = () => {
//     socket.emit('call-accept', {type: "VIDEO", recepientDetails})
// }

//     return (
//         <div className='fixed inset-0 z-50  w-screen overflow-hidden h-screen flex items-center justify-center'>
//             <div className='w-full h-full flex flex-col items-center justify-center rounded-md gap-4  border-primary border-2 bg-card overflow-hidden'>
//                 <div className='flex flex-col items-center justify-center'>
//                     <div className='w-24 h-24 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
//                         <Avatar className="flex items-center justify-center">
//                             <AvatarImage src={recepientDetails?.images?.profile} alt="Avatar" />
//                             <AvatarFallback className='text-4xl'>{recepientDetails?.firstname[0]?.toUpperCase() + recepientDetails?.lastname[0]?.toUpperCase()}</AvatarFallback>
//                         </Avatar>
//                     </div>
//                     <div>{recepientDetails?.firstname + recepientDetails?.lastname}
//                     </div>
//                 </div>
//                 <div >
//                     <span>Calling...</span>
//                 </div>
//                 <div className='flex gap-2 z-50'>
//                     <Button onClick={callDecline} className='bg-destructive'>Decline</Button>
//                     <Button onClick={callAccept} >Attend</Button>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default VideoCallRecepient