import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { EllipsisVertical, Heart } from 'lucide-react'
import { CiSquareRemove } from 'react-icons/ci'
import { FaEye, FaHeart } from 'react-icons/fa'
import { AiOutlineHeart } from 'react-icons/ai'
import { axiosClient } from '@/api/axiosClient'
import { Link } from 'react-router-dom'
import { domain } from '@/config/domain'
import { MdCancel } from 'react-icons/md'
import { formatDistanceToNow } from 'date-fns'

function Story({ stories, openedStoryIndex, user, storyViewIndex, setOpenedStoryIndex, setStoryViewIndex, setStoryViewModelState, setOpenStory, pauseStory, startStory, removeStory }) {
    const [storyViewsData, setStoryViewsData] = useState(null)
    const [storyViewersState, setStoryViewersState] = useState(false)
    const [storyLikesData, setStoryLikesData] = useState(null)
    const [storyLikesState, setStoryLikesState] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const [isLikeLoading, setIsLikeLoading] = useState(false)

    const currentStory = stories[openedStoryIndex]?.stories[storyViewIndex]
    const isOwnStory = stories[openedStoryIndex]?.user?.username === user?.username

    useEffect(() => {
        const fetchUserStoryViews = async (storyId) => {
            const { data } = await axiosClient.get("stories/views", { params: { storyId } })
            setStoryViewsData(data)
            return data
        }

        const fetchUserStoryLikes = async (storyId) => {
            try {
                const { data } = await axiosClient.get("stories/likes", { params: { storyId } })
                const likesData = data?.likes || data || []
                setStoryLikesData(likesData)
                return likesData
            } catch (error) {
                console.error('Error fetching story likes:', error)
                setStoryLikesData([])
            }
        }

        if (stories && openedStoryIndex >= 0 && storyViewIndex >= 0) {
            const storyId = stories[openedStoryIndex].stories[storyViewIndex]._id
            
            if (isOwnStory) {
                fetchUserStoryViews(storyId)
                fetchUserStoryLikes(storyId)
            }
            
            
            setIsLiked(currentStory?.isLiked || false)
            
            console.log(storyId, 'current story id')
        }

        return () => {
            setStoryViewsData(null)
            setStoryViewersState(false)
            setStoryLikesData(null)
            setStoryLikesState(false)
        }

    }, [stories, openedStoryIndex, storyViewIndex, isOwnStory])

    const handleLike = async () => {
        if (isLikeLoading || isOwnStory || isLiked) return

        try {
            setIsLikeLoading(true)
            setIsLiked(true)

            await axiosClient.post('/stories/like', {
                storyId: currentStory._id,
            })

            
            if (currentStory) {
                currentStory.isLiked = true
            }

        } catch (error) {
            setIsLiked(false)
            console.error('Error liking story:', error)
        } finally {
            setIsLikeLoading(false)
        }
    }

    let storiesDifferenciation = []

    for (let i = 0; i < stories[openedStoryIndex]?.stories?.length; i++) {
        storiesDifferenciation.push(i)
    }

    return (
        <div className="relative h-screen z-50">
            <div className='flex gap-1 mt-[2px]'>
                {storiesDifferenciation.map((i, index) => {
                    if (storyViewIndex == i) {
                        return <div key={index} className='h-[2px] w-full bg-green-500'></div>
                    }
                    return <div key={index} className='h-[2px] w-full bg-gray-700'></div>
                })}
            </div>

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

                        <p className="py-1 text-xs text-white" >{formatDistanceToNow(stories[openedStoryIndex]?.stories[storyViewIndex]?.createdAt ?? Date.now(), { addSuffix: true })}</p>
                    </div>
                    {isOwnStory &&
                        < DropdownMenu >
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-8 text-white  p-2 rounded-md">
                                    <EllipsisVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className='border-2 z-50 border-accent cursor-pointer relative top-2 bg-card rounded-md'>
                                <DropdownMenuItem className=' cursor-pointer hover:bg-accent flex gap-2 p-2 items-center justify-center z-20' onClick={async () => {
                                    let storyId = stories[openedStoryIndex]?.stories[storyViewIndex]?._id
                                    removeStory.mutate({ storyId, openedStoryIndex, storyViewIndex, url: stories[openedStoryIndex]?.stories[storyViewIndex]?._id })
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
            <div className="flex items-center aspect-auto max-w-96 h-full justify-center overflow-hidden bg-dark" onClick={() => {
                if (storyViewIndex < stories[openedStoryIndex].stories.length - 1) {
                    setStoryViewIndex(storyViewIndex + 1)
                } else {
                    setOpenedStoryIndex(-1)
                    setStoryViewIndex(0)
                    setStoryViewModelState(false)
                    setOpenStory(false)
                }
            }}>
                <img
                    onMouseDown={pauseStory}
                    onMouseUp={startStory}
                    onTouchStart={pauseStory}
                    onTouchEnd={startStory}
                    src={stories[openedStoryIndex]?.stories[storyViewIndex]?.url} alt="" onClick={() => {
                    }} />
            </div>

            {!isOwnStory && (
                <div className="absolute bottom-4 right-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`bg-black/50 hover:bg-black/70 text-white rounded-full p-3 ${isLiked ? 'opacity-70' : ''}`}
                        onClick={handleLike}
                        disabled={isLikeLoading || isLiked}
                    >
                        {isLiked ? (
                            <FaHeart className="w-6 h-6 text-red-500" />
                        ) : (
                            <AiOutlineHeart className="w-6 h-6" />
                        )}
                    </Button>
                </div>
            )}

            {storyViewersState &&
                <div className='absolute z-[100] bottom-0 w-full h-[50%] bg-background rounded-sm'>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">Viewers</h3>
                        <MdCancel size={21} onClick={() => setStoryViewersState(false)} className='cursor-pointer' />
                    </div>
                    <div className="overflow-y-auto max-h-96 p-2">
                        {storyViewsData?.length > 0 ?
                            storyViewsData.map(({ userId }) => {
                                
                                const user = userId
                                return (
                                    <Link key={user._id} to={`${domain}/user/${user.username}`} className="items-center p-2 flex gap-2 bg-accent rounded-md cursor-pointer m-2" >
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
                </div>
            }

            {storyLikesState &&
                <div className='absolute z-[100] bottom-0 w-full h-[50%] bg-background rounded-sm'>
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">Liked By</h3>
                        <MdCancel size={21} onClick={() => setStoryLikesState(false)} className='cursor-pointer' />
                    </div>
                    <div className="overflow-y-auto max-h-96 p-2">
                        {storyLikesData?.length > 0 ?
                            storyLikesData.map((user) => {
                                return (
                                    <Link key={user._id} to={`${domain}/user/${user.username}`} className="items-center p-2 flex gap-2 bg-accent rounded-md cursor-pointer m-2" >
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
                            <div className='text-center p-2 w-full'>No Likes</div>
                        }
                    </div>
                </div>
            }

            {isOwnStory &&
                <div className="absolute flex gap-4 items-center bottom-4 left-4">
                    <div className="flex gap-2 items-center bg-black/50 rounded-full px-3 py-2 cursor-pointer" onClick={() => {
                        setStoryViewersState(true)
                    }}>
                        <FaEye className="text-white" />
                        <span className="text-white text-sm font-medium">
                            {storyViewsData ? storyViewsData?.length || 0 : 0}
                        </span>
                    </div>
                    <div className="flex gap-2 items-center bg-black/50 rounded-full px-3 py-2 cursor-pointer" onClick={() => {
                        setStoryLikesState(true)
                    }}>
                        <FaHeart className="text-white" />
                        <span className="text-white text-sm font-medium">
                            {storyLikesData ? storyLikesData?.length || 0 : 0}
                        </span>
                    </div>
                </div>
            }

        </div>
    )
}

export default Story