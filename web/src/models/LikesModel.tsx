import { axiosClient } from '@/api/axiosClient'
import { domain } from '@/config/domain'
import { usePostLikes } from '@/hooks/Post/usePost'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import React, { useEffect } from 'react'
import { BiHeart } from 'react-icons/bi'
import { MdClose } from 'react-icons/md'
import { Link } from 'react-router-dom'

function LikesModel({ setLikesModelState, postId }) {

  const { data, isLoading, isSuccess, isError, refetch } = usePostLikes(postId)


  const reactions = {
    'Thumbs up': '👍',
    
    Haha: '😆',
    Wow: '🤩',
    Sad: '😢',
    Angry: '😠',
    Applause: '👏',
    Fire: '🔥',
  };


  return (
    <div className='fixed inset-0 z-50 w-screen sm:p-8 overflow-hidden h-screen flex items-center justify-center'>
      <div className='absolute top-0 right-0 backdrop-blur-[1.5px] w-full h-full' onClick={() => {
        setLikesModelState(false)
      }}></div>
      <div className='flex flex-col items-center border border-accent shadow-lg p-2 bg-card max-w-md w-full min-h-[400px] sm:max-h-[600px] rounded-lg h-full overflow-auto  z-10'>
        <MdClose size={20} className='ml-auto cursor-pointer' onClick={() => {
          setLikesModelState(false)
        }} />
        {isSuccess
          &&
          <div className='flex w-full justify-between items-center p-2 px-3'>
            <span>User</span>
            <span>Reaction</span>
          </div>
        }
        {isError &&
          <div className='flex w-full items-center justify-center flex-col gap-2 '>
            <span>something went wrong...</span>
            <button onClick={() => {
              refetch()
            }}>Reload</button>
          </div>}
        {isLoading &&
          <div className='flex w-full items-center justify-center' >
            loading...
          </div>
        }
        {isSuccess &&
          data.map((page) => {
            return page.likedBy.map(({ user, reaction }) => {
              const fullname = user.firstname + ' ' + user?.lastname
              return (
                <div className='flex items-center justify-center p-2 gap-1 w-full bg-card hover:bg-accent' key={user._id}>
                  <div className='flex items-center gap-2 relative w-full '>
                    <Link to={domain + "/user/" + user.username} className='cursor-pointer flex w-full gap-2'>
                      <div className='w-16 h-16  rounded-lg flex items-center justify-center  border-primary border-2 overflow-hidden'>
                        <Avatar >
                          <AvatarImage src={user?.profile} alt="Avatar" />
                          <AvatarFallback className='text-2xl'>{fullname && fullname[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className=''>{fullname}</div>
                        <div className='text-gray-400 text-sm'>@{user.username}</div>
                      </div>
                    </Link>
                  </div>
                  <div className='p-2 flex flex-col items-end justify-end'>
                    <span className='text-sm'>{reaction}</span>
                    {reactions[reaction]
                      ||
                      
                      
                      
                      
                      '❤️'
                    }
                  </div>
                </div>
              )
            })
          })
        }
      </div>
    </div>
  )
}

export default LikesModel