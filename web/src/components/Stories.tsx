import { axiosClient } from "@/api/axiosClient"
import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { useAppSelector } from "@/app/hooks"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"

function Stories() {
    let [storyUrl, setStoryUrl] = useState(undefined)
    let [storySrc, setStorySrc] = useState(undefined)
    let [stories, setStories] = useState([])
    let [userStory, setUserStory] = useState({ stories: null })
    let [storyViewIndex, setStoryViewIndex] = useState(null)
    let [openedStoryIndex, setOpenedStoryIndex] = useState(null)
    const { user } = useAppSelector((data) => data.user)
    const { username, firstname, lastname, images } = user
    let [storyViewModelState, setStoryViewModelState] = useState(undefined)
    const [isPaused, setIsPaused] = useState(false)
    const storyTimeRef = useRef(null)

    let uploadStory = async () => {
        let formData = new FormData();
        formData.append('file', storySrc)
        console.log(storySrc)
        await axiosClient.post("/stories/create", formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }

    useEffect(() => {
        const getStories = async () => {
            const { data } = await axiosClient.get("stories")
            console.log(data)
            const storiesIndex = data.findIndex((storyData) => {
                if (storyData.user.username == username) {
                    return storyData
                }
            })
            if (storiesIndex >= 0) {
                setUserStory(data[storiesIndex])
                let updatedStories = [...data]
                updatedStories.splice(storiesIndex, 1)
                setStories([data[storiesIndex], ...updatedStories])
            }
        }

        getStories()
    }, [])

    let [openStory, setOpenStory] = useState(false)
    useEffect(() => {
        console.log(stories.length)
        if (stories.length > 0 && openedStoryIndex >= 0 && storyViewIndex >= 0 && !isPaused) {
            console.log(openedStoryIndex, storyViewIndex)
            storyTimeRef.current = setInterval(() => {
                if (openedStoryIndex == stories.length - 1 && storyViewIndex == stories[openedStoryIndex].stories.length - 1) {
                    console.log('right equal')
                    setOpenedStoryIndex(0)
                    setStoryViewIndex(0)
                    setStoryViewModelState(false)
                    setOpenStory(false)
                }

                if (openedStoryIndex < stories.length - 1 && storyViewIndex == stories[openedStoryIndex].stories.length - 1) {
                    setOpenedStoryIndex(openedStoryIndex + 1)
                    setStoryViewIndex(0)
                }

                if (storyViewIndex < stories[openedStoryIndex].stories.length - 1) {
                    console.log(storyViewIndex)
                    setStoryViewIndex(storyViewIndex + 1)
                }

            }, 3000)
            return () => clearInterval(storyTimeRef.current)
        }
    }, [openStory, storyViewIndex, openedStoryIndex, isPaused])


    const pauseStory = () => {
        setIsPaused(true)
        clearInterval(storyTimeRef.current)
    }

    const startStory = () => {
        setIsPaused(false)
    }


    return (
        <div className='flex gap-3  overflow-hidden  overflow-x-auto z-40'>
            {openStory && openedStoryIndex >= 0 && storyViewIndex >= 0 && stories?.length > 0 &&
                // <div className="z-50 absolute top-0 left-0 w-full h-full flex overflow-hidden items-center justify-center bg-black" onClick={() => {
                // }}>
                //     <div className="w-full flex items-center justify-center">
                //         <StoryCarousel users={stories} storyViewIndex={storyViewIndex} setOpenStory={setOpenStory} />
                //     </div>
                // </div>
                <div className="z-50 absolute top-0 left-0 justify-center items-center w-full h-screen flex bg-black" onClick={() => {
                }}>
                    <div onClick={() => {
                        if (openedStoryIndex >= 0 && openedStoryIndex <= stories.length - 1 && storyViewIndex <= stories[openedStoryIndex].stories.length - 1 && storyViewIndex > 0) {
                            setStoryViewIndex(storyViewIndex - 1)
                        }


                        if (storyViewIndex == 0 && openedStoryIndex > 0) {
                            setOpenedStoryIndex(openedStoryIndex - 1)
                        }
                    }}>
                    </div>
                    <div className="relative h-screen z-50">
                        <div className="absolute p-2 flex gap-2">
                            <div className='w-14 h-14 bg-accent flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                                <Avatar className="flex">
                                    <AvatarImage src={stories[openedStoryIndex].user?.images?.profile} alt="Avatar" />
                                    <AvatarFallback>{stories[openedStoryIndex].user?.firstname[0]?.toUpperCase() + stories[openedStoryIndex].user?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex flex-col">
                                <div className="text-md">
                                    {stories[openedStoryIndex].user?.firstname + stories[openedStoryIndex].user?.lastname}
                                </div>
                                <span className="text-sm">
                                    @{stories[openedStoryIndex].user?.username}
                                </span>
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
                    </div>

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
                <div className="absolute rounded-md z-50 top-0 flex items-center justify-center left-0 w-screen h-screen">
                    <div className="absolute z-10 top-0 left-0 h-screen w-screen bg-black opacity-20" onClick={() => {
                        setStoryViewModelState(false)
                    }}>

                    </div>
                    <div className="z-50 w-fit h-fit p-2 flex flex-col gap-2 bg-card">
                        <h3>Upload Story</h3>
                        <div className="w-80 overflow-hidden">
                            <img className="w-full" src={storyUrl} alt="" />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button onClick={() => {
                                setStoryViewModelState(false)
                            }}>Cancel</Button>
                            <Button onClick={async () => {
                                const formData = new FormData()
                                formData.append("file", storySrc, storySrc.filename)
                                formData.append("data", JSON.stringify({ details: { username, userId: user?._id, type: 'story' } }))
                                // const response = await axiosClient.post("/upload/single", formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                                // const { data } = await axiosClient.post("/stories/create", { storyDetails: { url: response.data } })
                                uploadStory()
                            }}>Upload</Button>
                        </div>
                    </div>
                </div>
            }
            <div className='relative flex text-sm flex-col items-center gap-2'>
                {/* story upload */}
                <form onSubmit={uploadStory} className='image-upload_form'>
                    <label htmlFor="image">
                        <div className='w-5 h-5 z-10 bottom-7 right-0 bg-primary text-primary-foreground  shadow-md rounded-full text-base font-medium flex items-center justify-center absolute '>
                            +
                        </div>
                    </label>
                    <input className="hidden" type="file" accept='image/*' id='image' onChange={async (e) => {
                        setStoryUrl(URL.createObjectURL(e.target.files[0]))
                        setStorySrc(e.target.files[0])
                        setStoryViewModelState(true)
                    }} />
                </form>

                <div className='w-14 h-14 flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                    {userStory?.stories && userStory?.stories[0]?.url ?
                        <img className='object-cover' src={userStory?.stories && userStory?.stories[0]?.url} alt="" onClick={() => {
                            setOpenedStoryIndex(0)
                            setStoryViewIndex(0)
                            console.log('personal')
                            setOpenStory(true)
                        }} />
                        : <Avatar className="flex">
                            <AvatarImage src={images?.profile} alt="Avatar" />
                            <AvatarFallback>{firstname[0]?.toUpperCase() + lastname[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                    }

                </div>
                <div className='flex flex-col gap-0'>
                    <h3 className='text-card-foreground text-sm'>You</h3>
                </div>
            </div>
            {
                stories?.length > 0 &&
                stories?.map((storyMain, i) => {
                    if (storyMain?.user?.username == username) {

                        return null
                    }
                    return (
                        <div className='relative flex text-sm flex-col items-center gap-2'>
                            {/* story upload */}
                            <form onSubmit={uploadStory} className='image-upload_form'>
                                <label htmlFor="image">
                                </label>
                                <input className="hidden" type="file" accept='image/*' id='image' onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.addEventListener('load', () => {
                                            setStorySrc(reader.result as string);
                                        });
                                        setStoryUrl(URL.createObjectURL(e.target.files[0]))
                                        setStoryViewModelState(true)
                                    }
                                }} />
                            </form>

                            <div className='w-14 h-14 flex items-center justify-center rounded-full overflow-hidden border-2 border-primary-active'>
                                <img className='w-full' src={storyMain?.stories[0].url} alt="" onClick={() => {
                                    console.log('other')
                                    setOpenedStoryIndex(i)
                                    setStoryViewIndex(0)
                                    setOpenStory(true)
                                }} />
                            </div>
                            <div className='flex flex-col gap-0'>
                                <h3 className='text-card-foreground text-sm'>@{storyMain?.user?.username}</h3>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}

export default Stories