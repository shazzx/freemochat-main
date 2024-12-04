import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { EllipsisVertical } from 'lucide-react'
import { CiSquareRemove } from 'react-icons/ci'
import { FaEye } from 'react-icons/fa'
import { axiosClient } from '@/api/axiosClient'
import { Link } from 'react-router-dom'
import { domain } from '@/config/domain'
import { MdCancel } from 'react-icons/md'
import { format, formatDistance, formatDistanceToNow, subHours } from 'date-fns'

function Story({ stories, openedStoryIndex, user, storyViewIndex, setOpenedStoryIndex, setStoryViewIndex, setStoryViewModelState, setOpenStory, pauseStory, startStory, removeStory }) {
    const [storyViewsData, setStoryViewsData] = useState(null)
    const [storyViewersState, setStoryViewersState] = useState(false)

    useEffect(() => {
        const fetchUserStoryViews = async (storyId) => {
            const { data } = await axiosClient.get("stories/views", { params: { storyId } })
            setStoryViewsData(data)
            return data
        }
        if (stories && openedStoryIndex >= 0 && storyViewIndex >= 0) {
            fetchUserStoryViews(stories[openedStoryIndex].stories[storyViewIndex]._id)
            console.log(stories[openedStoryIndex]?.stories[storyViewIndex]?._id, 'current story id')
        }

    }, [stories, openedStoryIndex, storyViewIndex])

    useEffect(() => {
        console.log(storyViewsData)
    }, [storyViewsData])

    return (
        <div className="relative h-screen z-50">
            <div className="absolute w-full items-center p-2 flex  gap-2">
                <div className='w-14 h-14 bg-accent flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                    <Avatar className="flex">
                        <AvatarImage src={stories[openedStoryIndex].user?.profile} alt="Avatar" />
                        <AvatarFallback>{stories[openedStoryIndex].user?.firstname[0]?.toUpperCase() + stories[openedStoryIndex].user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                </div>

                <div className="flex flex-1 justify-between">
                    <div className="flex flex-col">
                        <div className="text-md text-white">
                            {stories[openedStoryIndex].user?.firstname + stories[openedStoryIndex].user?.lastname}
                        </div>
                        <span className="text-sm text-gray-300">
                            @{stories[openedStoryIndex].user?.username}
                        </span>

                        <p className="py-1 text-xs text-white" >{formatDistanceToNow(stories[openedStoryIndex]?.stories[storyViewIndex]?.createdAt, { addSuffix: true })}</p>
                    </div>
                    {(stories[openedStoryIndex].user?.username == user.username) &&
                        < DropdownMenu >
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-8 text-white  p-2 rounded-md">
                                    <EllipsisVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md'>
                                <DropdownMenuItem className=' cursor-pointer hover:bg-accent flex gap-2 p-2 items-center justify-center z-20' onClick={async () => {
                                    // axiosClient.post("/stories/delete", { storyId: stories[openedStoryIndex]?.stories[storyViewIndex]?._id, url: stories[openedStoryIndex]?.stories[storyViewIndex]?._id })
                                    let storyId = stories[openedStoryIndex]?.stories[storyViewIndex]?._id
                                    // let _stories = [...stories]
                                    removeStory.mutate({ storyId, openedStoryIndex, storyViewIndex, url: stories[openedStoryIndex]?.stories[storyViewIndex]?._id })
                                    // _stories[openedStoryIndex].stories.splice(storyViewIndex, 1)
                                    // setStories(_stories)
                                    // setLoad(true)
                                    setOpenedStoryIndex(0)
                                    setStoryViewIndex(0)
                                    setStoryViewModelState(false)
                                    setOpenStory(false)
                                    pauseStory()
                                }}><CiSquareRemove size={22} /> <span>Remove</span></DropdownMenuItem>

                            </DropdownMenuContent>

                        </DropdownMenu>
                    }

                </div>
            </div>
            <div className="flex items-center aspect-auto max-w-96 h-full justify-center overflow-hidden bg-dark ">
                <img
                    onMouseDown={pauseStory}
                    onMouseUp={startStory}
                    onTouchStart={pauseStory}
                    onTouchEnd={startStory}
                    src={stories[openedStoryIndex]?.stories[storyViewIndex]?.url} alt="" onClick={() => {
                    }} />
            </div>

            {storyViewersState &&
                <div className='absolute z-[100] bottom-0 w-full h-[50%] bg-background rounded-sm'>
                    <MdCancel size={21} onClick={() => setStoryViewersState(false)} className='cursor-pointer ml-auto m-2' />
                    {storyViewsData?.length > 0 ?
                        storyViewsData.map(({ userId }) => {
                            // userId == user object
                            const user = userId
                            return (
                                <Link to={`${domain}/user/${user.username}`} className="items-center p-2 flex gap-2 bg-accent rounded-md cursor-pointer m-2" >
                                    <div className='w-14 h-14 bg-accent flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                                        <Avatar className="flex">
                                            <AvatarImage src={user?.profile} alt="Avatar" />
                                            <AvatarFallback>{user?.firstname[0]?.toUpperCase() + user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                    </div>

                                    <div className="flex flex-1 justify-between">
                                        <div className="flex flex-col">
                                            <div className="text-md text-white">
                                                {user?.firstname + " " + user?.lastname}
                                            </div>
                                            <span className="text-sm text-gray-300">
                                                @{user?.username}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                        :
                        <div className='text-center p-2 w-full'>No Views</div>
                    }
                </div>
            }
            {stories[openedStoryIndex]?.user?.username == user.username &&
                <div className="absolute flex gap-2 items-center justify-center flex-col bottom-2 left-2 cursor-pointer" onClick={() => {
                    setStoryViewersState(true)
                }}>
                    <FaEye />
                    <span>
                        {storyViewsData ? storyViewsData?.length > 0 ? storyViewsData.length == 1 ? storyViewsData.length + " View" : storyViewsData.length + " Views" : 0 : 0}
                    </span>
                </div>
            }

        </div>
    )
}

export default Story