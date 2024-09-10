import { FC } from "react"

export const MediaOpenModel = ({ setMediaOpenModel, setMediaOpenDetails, mediaOpenDetails }) => {
    return (
        <div className='absolute top-0 right-0 w-screen z-50 overflow-hidden h-screen flex justify-center items-center'>
            <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
                setMediaOpenModel(false)
                setMediaOpenDetails({ type: '', url: '' })
            }}>
            </div>
            <div className='aspect-auto h-[500px] bg-card rounded-md z-10'>
                {mediaOpenDetails.type == 'video' ?
                    <video src={mediaOpenDetails.url} controls className='w-full'></video>
                    :
                    <img src={mediaOpenDetails.url} className="h-full" alt="" />
                }
            </div>
        </div>
    )
}
