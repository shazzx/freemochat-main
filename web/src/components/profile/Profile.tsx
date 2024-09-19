import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useState } from 'react'
import { MdClose } from 'react-icons/md'

type profileProps = {
    image: string,
    fallbackName: string,
    width: string,
    height: string,
    smWidth: string,
    smHeight: string,
    upload?: boolean,
    isUploading?: boolean
}

const Profile: React.FC<profileProps> = ({ image, fallbackName, width, height, smWidth, smHeight, upload, isUploading }) => {
    const [profileOpen, setProfileOpen] = useState(false)
    return (
        <>
            {
        profileOpen &&
        <div className='fixed inset-0 z-50  w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
          <div className='absolute w-full h-full bg-black opacity-80'>
          </div>
            <MdClose size={28} cursor="pointer" className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50" onClick={() => {
              setProfileOpen(false)
            }} />
          <div className='flex items-center justify-center w-full z-50'>
            <img src={image} className='w-full sm:w-[80%] md:w-[60%] lg:w-[40%] object-contain' alt="image" />
          </div>
        </div>
      }
        <div className={`${width} ${height} ${smWidth} ${smHeight} relative group flex items-center justify-center rounded-xl  border-primary border-2 bg-profile text-foreground overflow-hidden`}>

                     <Avatar className="sm:flex">
                         <AvatarImage src={image} className='cursor-pointer' onClick={() => {
                                setProfileOpen(true)
                         }} alt="Avatar" />
                         <AvatarFallback className='text-4xl'>{fallbackName}</AvatarFallback>
                     </Avatar>

            {upload &&
                <div className='absolute inset-0 flex items-center justify-center bg-card bg-opacity-50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                    <span className='text-xl'>Upload</span>
                </div>
            }
        </div>
      </>

    )
}

export default Profile