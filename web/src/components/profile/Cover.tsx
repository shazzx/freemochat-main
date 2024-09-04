import { FC } from "react"
interface CoverProps {
  cover?: string,
  upload?: boolean,
}

const Cover: FC<CoverProps> = ({ cover, upload }) => {
  console.log(cover)
  return (
    <div className='relative group w-full aspect-[3/1] bg-profile roundd-md  overflow-hidden'>
      
      {cover ?
        <div>
                          
          <img className='w-full object-contain' src={cover} alt="" />
          {upload &&
            <div className='absolute inset-0 flex items-center justify-center bg-card bg-opacity-50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
              <span className='text-xl'>Upload</span>
            </div>
          }
        </div>
        :
        <div className='relative `w-full h-full flex items-center justify-center'>
          <div className='w-full h-full absolute'>
            <div className='absolute -bottom-24 -right-24 w-[200px]
                lg:w-[380px] lg:-bottom-48 lg:-right-48 aspect-square bg-particles rounded-full'></div>
            <div className='absolute -top-24 -left-24 w-[160px] lg:w-[300px] lg:-top-40 lg:-left-40 aspect-square bg-particles rounded-full'></div>
          </div>
          {upload &&
            <div className='absolute inset-0 flex items-center justify-center bg-card bg-opacity-50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
              <span className='text-xl'>Upload</span>
            </div>
          }
        </div>

      }
    </div>

  )
}

export default Cover