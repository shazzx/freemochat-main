import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React from 'react'

type profileProps = {
    image: string,
    fallbackName: string,
    width: string,
    height: string,
    smWidth: string,
    smHeight: string,
    upload?: boolean
}

const Profile:React.FC<profileProps> = ({ image, fallbackName, width, height, smWidth, smHeight, upload }) => {
    console.log(fallbackName)
    return (
        <div className={`${width} ${height} ${smWidth} ${smHeight} relative group flex items-center justify-center rounded-xl  border-primary border-2 bg-profile text-foreground overflow-hidden`}>

            <Avatar className="sm:flex">
                <AvatarImage src={image} alt="Avatar" />
                <AvatarFallback className='text-4xl'>{fallbackName}</AvatarFallback>
            </Avatar>
            {upload && 
            <div className='absolute inset-0 flex items-center justify-center bg-card bg-opacity-50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                <span className='text-xl'>Upload</span>
            </div>
            }
        </div>
    )
}

export default Profile