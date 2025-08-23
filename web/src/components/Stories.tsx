import { axiosClient } from "@/api/axiosClient"
import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { useAppSelector } from "@/app/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { EllipsisVertical, Plus } from "lucide-react"
import { CiSquareRemove } from "react-icons/ci"
import { useRemoveStory, useUploadStory, useUserStories } from "@/hooks/User/useUser"
import { MdClose } from "react-icons/md"
import { FaEye } from "react-icons/fa"
import { useUserStoryViews } from '../hooks/User/useUser';
import Story from "./Story"

function Stories() {
    let [storyUrl, setStoryUrl] = useState(undefined)
    let [storySrc, setStorySrc] = useState(undefined)
    let [stories, setStories] = useState([])
    let [userStory, setUserStory] = useState({ stories: [], user: null })
    let [storyViewIndex, setStoryViewIndex] = useState(null)
    let [openedStoryIndex, setOpenedStoryIndex] = useState(null)
    const { user } = useAppSelector((data) => data.user)
    const { username, firstname, lastname, profile, cover } = user
    let [storyViewModelState, setStoryViewModelState] = useState(undefined)
    const [isPaused, setIsPaused] = useState(false)
    const storyTimeRef = useRef(null)
    const [load, setLoad] = useState(false)

    let { data, isLoading, isSuccess } = useUserStories(user._id)
    const _uploadStory = useUploadStory(user._id)
    const removeStory = useRemoveStory(user._id)

    let uploadStory = async (story: File) => {
        if (!story) {
            return
        }
        let formData = new FormData();
        formData.append('file', story)
        console.log(story)
        let _userStories = userStory
        if (!_userStories?.user) {
            _userStories.user = user
        }

        setLoad(true)
        _uploadStory.mutate(formData)

        setUserStory({ ...userStory, ..._userStories })
    }

    useEffect(() => {
        const getStories = async () => {
            const storiesIndex = data && data.findIndex((storyData) => {
                if (storyData.user.username == username) {
                    return storyData
                }
            })
            if (storiesIndex >= 0) {
                setUserStory(data[storiesIndex])
                let updatedStories = [...data]
                updatedStories.splice(storiesIndex, 1)
                setStories([data[storiesIndex], ...updatedStories])
            } else {
                setStories(data)
            }
        }

        getStories()
    }, [data])

    const viewStory = async () => {
        try {
            const storyDetails = { storyId: stories[openedStoryIndex].stories[storyViewIndex]._id }
            const { data } = await axiosClient.post("stories/view", storyDetails)
            console.log(data)
        } catch (error) {
            console.log(error)
        }
    }

    let [openStory, setOpenStory] = useState(false)
    useEffect(() => {
        if (stories && stories.length > 0 && openedStoryIndex >= 0 && storyViewIndex >= 0 && !isPaused) {
            storyTimeRef.current = setInterval(() => {
                if (openedStoryIndex == stories.length - 1 && storyViewIndex == stories[openedStoryIndex].stories.length - 1) {
                    viewStory()
                    setOpenedStoryIndex(-1)
                    setStoryViewIndex(0)
                    setStoryViewModelState(false)
                    setOpenStory(false)
                    console.log('right equal he bro', storyTimeRef)
                }

                if (openedStoryIndex < stories.length - 1 && storyViewIndex == stories[openedStoryIndex].stories.length - 1) {
                    setOpenedStoryIndex(openedStoryIndex + 1)
                    viewStory()
                    setStoryViewIndex(0)
                }

                if (storyViewIndex < stories[openedStoryIndex].stories.length - 1) {
                    viewStory()
                    setStoryViewIndex(storyViewIndex + 1)
                }
                console.log(storyViewIndex, 'story viewindex')

            }, 3000)
        } else {
            if (storyTimeRef.current) {
                clearInterval(storyTimeRef.current)
            }
        }
        return () => {
            clearInterval(storyTimeRef.current)
        }
    }, [openStory, storyViewIndex, openedStoryIndex, isPaused, stories])

    const pauseStory = () => {
        clearInterval(storyTimeRef.current)
    }

    const startStory = () => {
        setIsPaused(false)
    }

    useEffect(() => {
        setLoad(false)
    }, [data, isLoading, isSuccess])

    return (
        <div className="w-full bg-card w-full bg-black">
            <div className='flex gap-2 overflow-hidden overflow-x-auto p-2 z-50 scrollbar-hide'>
                {stories && openStory && openedStoryIndex >= 0 && storyViewIndex >= 0 && stories?.length > 0 &&
                    <div className="z-50 fixed top-0 left-0 justify-center items-center w-full h-screen flex bg-black" onClick={() => {
                        clearInterval(storyTimeRef.current)
                    }}>
                        <MdClose className="absolute top-4 right-4 text-white size-8 cursor-pointer hover:bg-gray-800 rounded-full p-1 transition-colors" onClick={() => {
                            setOpenedStoryIndex(0)
                            setStoryViewIndex(0)
                            setStoryViewModelState(false)
                            clearInterval(storyTimeRef.current)
                            setOpenStory(false)
                        }} />

                        <div onClick={() => {
                            if (openedStoryIndex >= 0 && openedStoryIndex <= stories.length - 1 && storyViewIndex <= stories[openedStoryIndex].stories.length - 1 && storyViewIndex > 0) {
                                setStoryViewIndex(storyViewIndex - 1)
                            }

                            if (storyViewIndex == 0 && openedStoryIndex > 0) {
                                setOpenedStoryIndex(openedStoryIndex - 1)
                            }
                        }}>
                        </div>

                        <Story
                            openedStoryIndex={openedStoryIndex}
                            setOpenedStoryIndex={setOpenedStoryIndex}
                            pauseStory={pauseStory}
                            removeStory={removeStory}
                            setOpenStory={setOpenStory}
                            setStoryViewIndex={setStoryViewIndex}
                            setStoryViewModelState={setStoryViewModelState}
                            startStory={startStory}
                            stories={stories}
                            storyViewIndex={storyViewIndex}
                            user={user}
                        />

                        <div onClick={() => {
                            if (openedStoryIndex == stories.length - 1 && storyViewIndex == stories[openedStoryIndex].stories.length - 1) {
                                console.log('right equal')
                                setOpenedStoryIndex(0)
                                setStoryViewIndex(0)
                            }

                            if (openedStoryIndex < stories.length - 1 && storyViewIndex == stories[openedStoryIndex].stories.length - 1) {
                                setOpenedStoryIndex(openedStoryIndex + 1)
                            }

                            if (storyViewIndex < stories[openedStoryIndex].stories.length - 1) {
                                console.log(storyViewIndex)
                                setStoryViewIndex(storyViewIndex + 1)
                            }

                        }}>
                        </div>
                    </div>
                }

                {storyViewModelState &&
                    <div className="fixed rounded-md z-50 top-0 flex items-center justify-center left-0 w-screen h-screen">
                        <div className="absolute z-10 top-0 left-0 h-screen w-screen bg-black opacity-40" onClick={() => {
                            setStoryViewModelState(false)
                        }}>
                        </div>
                        <div className="z-50 w-fit h-fit p-4 flex flex-col gap-4 bg-card rounded-lg shadow-xl border">
                            <h3 className="text-lg font-semibold">Upload Story</h3>
                            <div className="w-80 max-w-sm overflow-hidden rounded-lg">
                                <img className="w-full object-cover" src={storyUrl} alt="" />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => {
                                    setStoryViewModelState(false)
                                }}>Cancel</Button>
                                <Button onClick={async () => {
                                    const formData = new FormData()
                                    formData.append("file", storySrc, storySrc.filename)
                                    formData.append("data", JSON.stringify({ details: { username, userId: user?._id, type: 'story' } }))
                                }}>Upload</Button>
                            </div>
                        </div>
                    </div>
                }

                {/* Current User Story */}
                <div className='relative flex flex-col items-center gap-2 flex-shrink-0'>
                    <div className="story-container group">
                        <div className='story-item relative overflow-hidden'>
                            {(!isLoading && !load) && userStory?.stories && userStory?.stories[0]?.url ? (
                                <div
                                    className="story-background cursor-pointer"
                                    onClick={() => {
                                        setOpenedStoryIndex(0)
                                        setStoryViewIndex(0)
                                        console.log('personal')
                                        setOpenStory(true)
                                    }}
                                >
                                    <img
                                        className='story-image'
                                        src={userStory?.stories && userStory?.stories[0]?.url}
                                        alt=""
                                    />
                                    <div className="story-gradient" />

                                    {/* User Avatar */}
                                    <div className='story-avatar w-14 h-14 bg-accent flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                                        <Avatar className="flex">
                                            <AvatarImage src={profile} alt="Avatar" />
                                            <AvatarFallback>{firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </div>

                                    {/* Add Story Button */}
                                    <label
                                        htmlFor="image"
                                        className="story-add-btn cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Plus size={16} className="text-white" />
                                    </label>
                                </div>
                            ) : (
                                (!isLoading && !load) && (
                                    <label htmlFor="image" className="story-add-container cursor-pointer">
                                        {/* Background */}
                                        <div className="story-add-background">
                                            {profile ? (
                                                <img src={profile} alt="" className="story-image opacity-30" />
                                            ) : (
                                                <div className="story-placeholder" />
                                            )}
                                            <div className="story-gradient" />
                                        </div>

                                        {/* User Avatar */}
                                        <div className='story-avatar w-14 h-14 bg-accent flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                                            <Avatar className="flex">
                                                <AvatarImage src={profile} alt="Avatar" />
                                                <AvatarFallback>{firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Add Icon */}
                                        <div className="story-add-icon">
                                            <Plus size={24} className="text-blue-500" />
                                        </div>
                                    </label>
                                )
                            )}

                            {(isLoading || load) && (
                                <div className="story-loading">
                                    <svg className="text-gray-400 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                                        <path d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <input
                            className="hidden"
                            name="image"
                            type="file"
                            accept='image/*'
                            id='image'
                            onChange={(e) => {
                                uploadStory(e.target.files[0])
                            }}
                        />
                    </div>

                    <div className='story-username'>
                        <h3 className='text-card-foreground text-xs font-medium'>Your Story</h3>
                    </div>
                </div>

                {/* Other Users Stories */}
                {stories?.length > 0 && stories?.map((storyMain, i) => {
                    if (storyMain?.user?.username == username) {
                        return null
                    }
                    return (
                        <div key={i} className='relative flex flex-col items-center gap-2 flex-shrink-0'>
                            <div className="story-container group">
                                <div className='story-item relative overflow-hidden cursor-pointer' onClick={() => {
                                    console.log('other')
                                    setOpenedStoryIndex(i)
                                    setStoryViewIndex(0)
                                    setOpenStory(true)
                                }}>
                                    <div className="story-background">
                                        <img
                                            className='story-image'
                                            src={storyMain?.stories[0].url}
                                            alt=""
                                        />
                                        <div className="story-gradient" />

                                        {/* User Avatar */}
                                        <div className='story-avatar w-14 h-14 bg-accent flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                                            <Avatar className="flex">
                                                <AvatarImage src={storyMain?.user?.profile} alt="Avatar" />
                                                <AvatarFallback>
                                                    {storyMain?.user?.firstname?.[0]?.toUpperCase() + storyMain?.user?.lastname?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='story-username'>
                                <h3 className='text-card-foreground text-xs font-medium'>
                                    {storyMain?.user?.username}
                                </h3>
                            </div>
                        </div>
                    )
                })}
            </div>

            <style>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                .story-container {
                    width: 114px;
                    height: 196px;
                }
                
                .story-item {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    border: 2px solid transparent;
                    transition: all 0.2s ease;
                }
                
                .story-item:hover {
                    transform: scale(1.02);
                    border-color: rgba(0, 149, 246, 0.5);
                }
                
                .story-background {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                
                .story-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .story-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.6) 100%);
                }
                
                .story-avatar {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid white;
                }
                
                .story-add-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .story-add-btn:hover {
                    background: rgba(0, 0, 0, 0.8);
                    transform: scale(1.1);
                }
                
                .story-add-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .story-add-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                }
                
                .story-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                }
                
                .story-add-icon {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                .story-loading {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                }
                
                .story-username {
                    width: 114px;
                    text-align: center;
                }
                
                .story-username h3 {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                  @media (max-width: 640px) {
        .story-container {
            width: 90px;
            height: 156px;
        }
        
        .story-username {
            width: 90px;
        }
        
        .story-avatar {
            width: 26px;
            height: 26px;
            top: 6px;
            left: 6px;
        }
        
        .story-add-btn {
            width: 20px;
            height: 20px;
            top: 6px;
            right: 6px;
        }
    }
            `}</style>
        </div>
    )
}

export default Stories