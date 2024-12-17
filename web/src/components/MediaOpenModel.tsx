import { MdClose } from "react-icons/md"

export const MediaOpenModel = ({ setMediaOpenModel, setMediaOpenDetails, mediaOpenDetails }) => {
    return (
        <div className='fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
            <div className='absolute top-0 bg-background opacity-70 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setMediaOpenModel(false)
                setMediaOpenDetails({ type: '', url: '' })
            }}>
            </div>
            <MdClose size={28} cursor="pointer" className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50" onClick={() => {
                setMediaOpenModel(false)
                setMediaOpenDetails({ type: '', url: '' })
            }} />
            <div className='flex items-center h-screen  justify-center aspect-auto  max-w-[100%] lg:max-w-[80%] md:max-w-[70%] max-h-[80%] rounded-md z-10'>
                {mediaOpenDetails.type == 'video' ?
                    <video src={mediaOpenDetails.url} controls className='h-full object-contain'></video>
                    :
                    <img src={mediaOpenDetails.url} className="h-full object-contain" alt="" />
                }
            </div>
        </div>
    )
}
