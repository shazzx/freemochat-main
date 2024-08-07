import { useAppSelector } from '@/app/hooks';
import AudioPlayer from '@/AudioPlayer';
import { useMessages } from '@/hooks/Chat/main';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import React, { useEffect, useRef, useState } from 'react'
import { FaFilePdf } from 'react-icons/fa';
import { useInView } from 'react-intersection-observer';
import { Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { EllipsisIcon } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

function QuickChat({ target }) {
    const { user } = useAppSelector(state => state.user)
    const { socket } = useAppSelector((data) => data.socket) as { socket: Socket }
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState("")
    const recepientDetails = { targetId: target?.data?._id, username: target?.data?.handle, type: "Page" }
    const chatContainerRef = useRef(null)
    const queryClient = useQueryClient()
    const [dropDownMessageIndex, setDropDownMessageIndex] = useState(null)
    const [dropDownMessagePageIndex, setDropDownMessagePageIndex] = useState(null)
    const { inView, ref } = useInView()

    const [openedDropDownMessageId, setOpenedDropDownMessageId] = useState(null)
    const [dropDownMessageId, setDropDownMessageId] = useState(null)
    const [openPdf, setOpenPdf] = useState(false)

    const scrollToBottom = () => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }

    const userMessages = useMessages(target?.data?._id)
    console.log(userMessages)

    const deleteMessage = async (messageId) => {
        const { data } = await axiosClient.post("/messages/remove", { messageId })
        console.log(data)
    }

    useEffect(() => {
        scrollToBottom()
    }, [userMessages?.data])


    const handleSendMessage = (e) => {
        if (e.key !== "Enter" || inputValue.trim().length === 0) return;

        // send a message to the server
        // setMessages((previousMessages) => [...previousMessages, { recepeint: target?.data?._id, sender: user?._id, content: inputValue, type: "Page" }]);
        const messageData = { recepeint: target?.data?._id, sender: user?._id, content: inputValue, type: recepientDetails?.type }


        queryClient.setQueryData(["messages", target?.data?._id], (pages: any) => {
            const updatedMessages = produce(pages, (draft: any) => {
                if (draft.pages[draft.pages.length - 1].messages) {
                    draft.pages[draft.pages.length - 1].messages = [...draft.pages[draft.pages.length - 1].messages, messageData]
                    return draft
                }
                throw new Error()
            })
            return updatedMessages
        });


        socket.emit("chat", { senderDetails: { targetId: user?._id, username: user?.username }, body: inputValue, recepientDetails });
        setInputValue("");
    };

    return (
        <div className='absolute z-50 bg-background flex flex-col max-w-[560px] h-full max-h-[440px] border-2 border-accent bottom-12 right-12 ' >

            <div className='flex items-center justify-between p-3 border border-muted'>
                <div className='flex gap-2 items-center justify-center'>
                    {/* praying man */}
                    <div className='w-10 h-10 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        {recepientDetails?.type == "User" ? <Avatar className="h-9 w-9 flex items-center justify-center">
                            <AvatarImage src={target?.data?.images?.profile} alt="Avatar" />
                            <AvatarFallback>{target?.data?.firstname[0]?.toUpperCase() + target?.data?.lastname[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                            :
                            <Avatar className="h-10 w-10 flex items-center justify-center" onClick={() => {
                                // setChatGroupInfo(true)
                            }}>
                                <AvatarImage src={target?.data?.images?.profile} alt="Avatar" />
                                <AvatarFallback>{target?.data?.name[0]?.toUpperCase() + target?.data?.name[1]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        }
                    </div>
                    <div className='flex flex-col gap-0'>
                        <h3 className='text-card-foreground text-sm'>{target?.data?.type == "User" ? target?.data?.fullname : target?.data?.name}</h3>
                        <span className='text-muted-foreground text-xs'>@{target?.data?.handle}</span>
                    </div>
                </div>
            </div>
            <div className="h-full p-4 flex flex-col gap-4  overflow-y-scroll" onClick={() => {

            }} ref={chatContainerRef}>
                <div className="w-full text-center pb-4">
                    <span>Today</span>
                </div>
                {/* user */}

                {!userMessages.isLoading && userMessages?.data?.map((page, pageIndex) => {
                    return page.messages.map((message, messageIndex) => {
                        if (message?.deletedFor?.length > 0) {
                            const isDeleted = message?.deletedFor?.filter((deleted) => {
                                if (deleted?.userId == user?._id) {
                                    return deleted
                                }
                            })
                            if (isDeleted?.[0]?.userId == user?._id) {
                                return (
                                    <div className="flex gap-2 justify-end">

                                        <div className="relative max-w-80 w-fit">

                                            <div className="relative border border-muted
                                 text-sm bg-card p-1 text-foreground rounded-lg pr-3"

                                                onMouseEnter={() => {
                                                    setDropDownMessageIndex(messageIndex)
                                                    setDropDownMessagePageIndex(pageIndex)
                                                    setDropDownMessageId(message?._id || null)
                                                }} onMouseLeave={() => {
                                                    setDropDownMessageIndex(null)
                                                    setDropDownMessagePageIndex(null)
                                                    setDropDownMessageId(null)
                                                }}
                                            >
                                                <p className="" >content deleted</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        }
                        return (
                            message?.sender == user?._id?.toString() ?
                                <div className="flex gap-2 justify-end" key={message?._id}>
                                    {userMessages.data.length - 1 == pageIndex && userMessages.data[userMessages.data.length - 1].messages.length - 1 == messageIndex && <div ref={ref}></div>}
                                    <div className="relative max-w-80 w-fit">
                                        <div className={`relative ${!message?.media ? "p-2 pr-3" : "p-0"} border border-muted text-sm  text-primary-foreground rounded-lg `}
                                            onMouseEnter={() => {
                                                setDropDownMessageIndex(messageIndex)
                                                setDropDownMessagePageIndex(pageIndex)
                                                setDropDownMessageId(message?._id || null)
                                            }} onMouseLeave={() => {
                                                setDropDownMessageIndex(null)
                                                setDropDownMessagePageIndex(null)
                                                setDropDownMessageId(null)
                                            }}
                                        >
                                            {message?.media && message.media.type == "audio" &&
                                                <AudioPlayer src={message.media.url} duration={message.media.duration} />
                                            }
                                            {message?.media && message.media.type == "image" &&
                                                <div className="aspect-auto max-w-64 sm:max-w-96">
                                                    <img src={message.media.url} alt="" />
                                                </div>

                                            }
                                            {message?.media && message.media.type == "pdf" &&
                                                <div className="aspect-auto cursor-pointer p-3 max-w-64 ">
                                                    <a href={message.media.url} download className="flex">
                                                        <FaFilePdf className="text-red-500 text-2xl mr-3" />
                                                        <div className="flex-grow">
                                                            <p className="font-semibold truncate">{'File'}</p>
                                                            {/* <p className="text-sm text-gray-500">{(12 / 1024 / 1024).toFixed(2)} MB</p> */}
                                                        </div>
                                                    </a>
                                                </div>
                                            }
                                            {openPdf &&
                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                                                    <div className="bg-white p-4 rounded-lg w-3/4 h-3/4">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h2 className="text-xl font-bold">{"file.name"}</h2>
                                                            <Button onClick={() => setOpenPdf(false)}>Close</Button>
                                                        </div>

                                                    </div>
                                                </div>}
                                            {message?.media && message.media.type == "video" &&
                                                <div className="aspect-auto max-w-64 ">
                                                    <video src={message.media.url} controls />
                                                </div>
                                            }
                                            <p className="" >{message?.content}</p>
                                            {
                                                (dropDownMessagePageIndex == pageIndex && dropDownMessageIndex == messageIndex && message?._id == dropDownMessageId) &&
                                                <div className="cursor-pointer absolute top-0 -right-2" onClick={() => {
                                                    setOpenedDropDownMessageId(message?._id)
                                                }}>
                                                    <EllipsisIcon />
                                                </div>

                                            }
                                            {
                                                dropDownMessagePageIndex == pageIndex && dropDownMessageIndex && message?._id && message?._id == openedDropDownMessageId &&
                                                <div className="absolute top-10 right-0 z-20">
                                                    <Button onClick={() => {
                                                        message?.deletedFor.push({ userId: user?._id })
                                                        deleteMessage(message?._id)
                                                    }}>Delete</Button>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                    <div className='max-w-10 max-h-10 rounded-full overflow-hidden'>

                                    </div>
                                </div>
                                :

                                <div className="flex" key={message?._id}>
                                    {userMessages.data.length - 1 == pageIndex && userMessages.data[userMessages.data.length - 1].messages.length - 1 == messageIndex && <div ref={ref}></div>}
                                    <div className="flex gap-2">
                                        <div className='max-w-10 max-h-10 bg-accent rounded-full overflow-hidden'>
                                            <Avatar className="h-9 w-9 flex items-center justify-center">
                                                <AvatarImage src={target?.data?.profile} alt="Avatar" />
                                                <AvatarFallback>{target?.data?.firstname[0]?.toUpperCase() + target?.data?.lastname[0]?.toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="relative max-w-80 w-fit">
                                            <div className="relative p-2 border border-muted text-sm bg-primary text-primary-foreground rounded-lg pl-3"

                                                onMouseEnter={() => {
                                                    setDropDownMessageIndex(messageIndex)
                                                    setDropDownMessagePageIndex(pageIndex)
                                                    setDropDownMessageId(message?._id || null)
                                                }} onMouseLeave={() => {
                                                    setDropDownMessageIndex(null)
                                                    setDropDownMessagePageIndex(null)
                                                    setDropDownMessageId(null)
                                                }}
                                            >
                                                {message?.media && message.media.type == "audio" &&
                                                    <AudioPlayer src={message.media.url} duration={message.media.duration} />
                                                }
                                                {message?.media && message.media.type == "image" &&
                                                    <div className="aspect-auto max-w-64 sm:max-w-96">
                                                        <img src={message.media.url} alt="" />
                                                    </div>

                                                }
                                                {message?.media && message.media.type == "pdf" &&
                                                    <div className="aspect-auto cursor-pointer p-3 max-w-64 ">
                                                        <a href={message.media.url} download className="flex">
                                                            <FaFilePdf className="text-red-500 text-2xl mr-3" />
                                                            <div className="flex-grow">
                                                                <p className="font-semibold truncate">{'File'}</p>
                                                                {/* <p className="text-sm text-gray-500">{(12 / 1024 / 1024).toFixed(2)} MB</p> */}
                                                            </div>
                                                        </a>
                                                    </div>
                                                }
                                                {openPdf &&
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                                                        <div className="bg-white p-4 rounded-lg w-3/4 h-3/4">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h2 className="text-xl font-bold">{"file.name"}</h2>
                                                                <Button onClick={() => setOpenPdf(false)}>Close</Button>
                                                            </div>

                                                        </div>
                                                    </div>}
                                                {message?.media && message.media.type == "video" &&
                                                    <div className="aspect-auto max-w-64 ">
                                                        <video src={message.media.url} controls />
                                                    </div>
                                                }
                                                <p className="" >{message?.content}</p>
                                                {
                                                    (dropDownMessagePageIndex == pageIndex && dropDownMessageIndex == messageIndex && message?._id == dropDownMessageId) &&
                                                    <div className="cursor-pointer absolute top-0 -right-2" onClick={() => {
                                                        setOpenedDropDownMessageId(message?._id)
                                                    }}>
                                                        <EllipsisIcon />
                                                    </div>

                                                }
                                                {
                                                    dropDownMessagePageIndex == pageIndex && dropDownMessageIndex && message?._id && message?._id == openedDropDownMessageId &&
                                                    <div className="absolute top-10 right-0 z-20">
                                                        <Button onClick={() => {
                                                            message?.deletedFor.push({ userId: user?._id })
                                                            deleteMessage(message?._id)
                                                        }}>Delete</Button>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                        )

                    })
                })}
            </div>
            <div className="flex gap-4 items-center justify-center p-2 flex-1">
                <div className="flex  items-center justify-center border border-primary h-11 rounded-md p-2 w-full">
                    {/* 
    {
        < div className="relative" ref={dropdownRef} >
            <div onClick={() => setFileSelectDropDownState(!fileSelectDropDownState)}>
                <Button variant="ghost" className="h-8 w-8 bg-card p-2 rounded-md">
                    <svg width="25" className="fill-white dark:fill-white" cursor="pointer" height="22" viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" width="24" height="22" rx="4" fill="#433FFA" />
                        <path d="M11.4545 16.3068V5.05682H13.3636V16.3068H11.4545ZM6.78409 11.6364V9.72727H18.0341V11.6364H6.78409Z" />
                    </svg>
                </Button>
            </div>
            {fileSelectDropDownState && <div className='absolute -left-2 bottom-12 flex w-44 flex-col bg-card p-1 rounded-md'>
                <label className="hover:bg-accent cursor-pointer  p-2" htmlFor="text-image">
                    <div className="flex items-center gap-2" >
                        <Image /> Image
                    </div>
                </label>
                <label className="hover:bg-accent cursor-pointer  p-2" htmlFor="text-video">
                    <div className="flex items-center gap-2" >
                        <Video /> Video
                    </div>
                </label>
                <label className="hover:bg-accent cursor-pointer  p-2" htmlFor="text-pdf">
                    <div className="flex items-center gap-2" >
                        <File />File <span className="text-xs">(Only PDF Supported)</span>
                    </div>
                </label>
            </div>
            }
        </div>
    } */}
                    {/* 
    <input className="hidden" type="file" accept='application/pdf' id='text-pdf' onChange={async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            console.log(e.target.files[0])
            const formData = new FormData()
            const messageData = { recepient: target?.data?._id, sender: user?._id, content: inputValue, type: target?.data?.type, mediaDetails: { type: "pdf", } }
            formData.append("messageData", JSON.stringify(messageData))
            formData.append("file", e.target.files[0], 'pdf')
            console.log(messageData, _pageData?.data)

            let { data } = await axiosClient.post("messages/create", formData, { headers: { 'Content-Type': "multipart/form-data" } })
            console.log(data)
            setFileSelectDropDownState(false)
        }
    }} />

    <input className="hidden" type="file" accept='image/*' id='text-image' onChange={async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            console.log(e.target.files[0])
            const formData = new FormData()
            const messageData = { recepient: _pageData?.data?._id, sender: user?._id, content: inputValue, type: _pageData?.data?.type, mediaDetails: { type: "image", } }
            formData.append("messageData", JSON.stringify(messageData))
            formData.append("file", e.target.files[0], 'image')
            createMessage.mutate({ messageData: { ...messageData, media: { type: "image", url: URL.createObjectURL(e.target.files[0]) } }, formData })
            // let { data } = await axiosClient.post("messages/create", formData, { headers: { 'Content-Type': "multipart/form-data" } })
            // console.log(data)
            // setFileSelectDropDownState(false)
        }
    }} />

    <input className="hidden" type="file" accept='video/*' id='text-video' onChange={async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            console.log(e.target.files[0])
            const formData = new FormData()
            const messageData = { recepient: _pageData?.data?._id, sender: user?._id, content: inputValue, type: _pageData?.data?.type, mediaDetails: { type: "video", } }
            formData.append("messageData", JSON.stringify(messageData))
            formData.append("file", e.target.files[0], 'video')
            console.log(messageData, recepientDetails)
            let { data } = await axiosClient.post("messages/create", formData, { headers: { 'Content-Type': "multipart/form-data" } })
            console.log(data)
            setFileSelectDropDownState(false)
        }
    }} /> */}

                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleSendMessage}
                        type="search"
                        placeholder="Type your message..."
                        className="w-full appearance-none bg-background pl-2 shadow-none border-none focus:outline-none"
                    />

                    <div>
                        {/* {!emojiPickerState && <div className="text-2xl" onClick={() => {
            setEmojiPickerState(true)
        }}>&#x1F600;</div>}

        {emojiPickerState && <MdCancel onClick={() => {
            setEmojiPickerState(false)
        }} />}

        <EmojiPicker open={emojiPickerState} onEmojiClick={(emoji) => {
            setEmojiPickerState(false)
            console.log(emoji)
            content.current.value = content.current.value + " " + emoji.emoji
        }} /> */}

                    </div>
                </div>

                < svg width="47" className="stroke-white dark:stroke-white" cursor="pointer" height="50" viewBox="0 0 47 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="1" width="46" height="48" rx="4" fill="#433FFA" />
                    <rect x="0.5" y="1" width="46" height="48" rx="4" stroke="#433FFA" stroke-linejoin="bevel" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M30.8814 24.0836L15.786 17.1726C15.3915 16.963 14.9089 16.9431 14.4952 17.1194C14.0815 17.2957 13.7897 17.6456 13.7148 18.0552C13.72 18.1913 13.7561 18.3249 13.8209 18.4477L16.695 24.7566C16.8392 25.1756 16.9177 25.6109 16.9282 26.0497C16.9178 26.4886 16.8393 26.9239 16.695 27.3428L13.8209 33.6518C13.7561 33.7746 13.72 33.9082 13.7148 34.0443C13.7902 34.4533 14.0819 34.8025 14.4952 34.9785C14.9085 35.1545 15.3905 35.1347 15.7846 34.9256L30.8814 28.0147C31.7233 27.6594 32.2618 26.8926 32.2618 26.0491C32.2618 25.2057 31.7233 24.4389 30.8814 24.0836V24.0836Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
        </div>
    )
}

export default QuickChat






































// import { useAppSelector } from '@/app/hooks';
// import React, { useRef, useState } from 'react'
// import { Socket } from 'socket.io-client';

// function QuickChat() {
//     const [emojiPickerState, setEmojiPickerState] = useState(false)
//     const { socket } = useAppSelector((data) => data.socket) as { socket: Socket }
//     const [chatGroupInfo, setChatGroupInfo] = useState(false)
//     const [inputValue, setInputValue] = useState("");
//     const [messages, setMessages] = useState([]);
//     const [groupData, setGroupData] = useState(null)
//     const chatContainerRef = useRef(null)
//     const [videoCallState, setVideoCallState] = useState("NEUTRAL")
//     const [videoCallCallerState, setVideoCallCallerState] = useState(false)

//     const [audioCallState, setAudioCallState] = useState("NEUTRAL")
//     const [audioCallCallerState, setAudioCallCallerState] = useState(false)
//     const [callDetails, setCallDetails] = useState(null)

//     const handleSendMessage = (e) => {
//         if (e.key !== "Enter" || inputValue.trim().length === 0) return;

//         // send a message to the server
//         setMessages((previousMessages) => [...previousMessages, { recepeint: recepientDetails?.type == "ChatGroup" ? recepientDetails.groupId : recepientDetails.userId, sender: user?._id, content: inputValue, type: recepientDetails?.type }]);

//         socket.emit("chat", { senderDetails: { userId: user?._id, username: user?.username }, body: inputValue, recepientDetails });
//         setInputValue("");
//     };

//   return (
//     <div className='absolute bottom-4 left-4'>

// <div className="flex gap-4 items-center justify-center p-2">
//                 <div className="flex  items-center justify-center border border-primary h-11 rounded-md p-2 w-full">
//                     <svg width="25" className="fill-white dark:fill-white" cursor="pointer" height="22" viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <rect x="0.5" width="24" height="22" rx="4" fill="#433FFA" />
//                         <path d="M11.4545 16.3068V5.05682H13.3636V16.3068H11.4545ZM6.78409 11.6364V9.72727H18.0341V11.6364H6.78409Z" />
//                     </svg>
//                     <input
//                         value={inputValue}
//                         onChange={(e) => setInputValue(e.target.value)}
//                         onKeyDown={handleSendMessage}
//                         type="search"
//                         placeholder="Type your message..."
//                         className="w-full appearance-none bg-background pl-8 shadow-none border-none focus:outline-none"
//                     />

//                     <div>
//                         {!emojiPickerState && <div className="text-2xl" onClick={() => {
//                             setEmojiPickerState(true)
//                         }}>&#x1F600;</div>}

//                         {emojiPickerState && <MdCancel onClick={() => {
//                             setEmojiPickerState(false)
//                         }} />}

//                         <EmojiPicker open={emojiPickerState} onEmojiClick={(emoji) => {
//                             setEmojiPickerState(false)
//                             console.log(emoji)
//                             // content.current.value = content.current.value + " " + emoji.emoji
//                         }} />

//                     </div>
//                 </div>
//                 <svg width="47" className="stroke-foreground dark:stroke-foreground" cursor="pointer" height="48" viewBox="0 0 47 48" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect x="1.5" y="1" width="44" height="46" rx="3" stroke="#A9A7FD" stroke-width="2" />
//                     <path d="M27.338 24.6263C27.338 25.7333 26.8955 26.7949 26.1078 27.5777C25.3202 28.3604 24.2519 28.8002 23.138 28.8002C22.0241 28.8002 20.9558 28.3604 20.1681 27.5777C19.3805 26.7949 18.938 25.7333 18.938 24.6263V18.7828C18.938 17.6758 19.3805 16.6141 20.1681 15.8314C20.9558 15.0486 22.0241 14.6089 23.138 14.6089C24.2519 14.6089 25.3202 15.0486 26.1078 15.8314C26.8955 16.6141 27.338 17.6758 27.338 18.7828V24.6263Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//                     <path d="M31.538 25.4609C31.5402 26.4482 31.3462 27.4261 30.9672 28.3386C30.588 29.2512 30.0312 30.0803 29.3287 30.7783C28.6262 31.4764 27.792 32.0298 26.8737 32.4065C25.9555 32.7833 24.9715 32.9761 23.978 32.974H22.298C21.3046 32.9761 20.3206 32.7833 19.4024 32.4065C18.4841 32.0298 17.6498 31.4764 16.9474 30.7783C16.2449 30.0803 15.6882 29.2512 15.309 28.3386C14.9299 27.4261 14.7358 26.4482 14.7381 25.4609" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//                     <path d="M23.1379 32.9741V36.3132" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//                 </svg>
//                 <svg width="47" className="stroke-white dark:stroke-white" cursor="pointer" height="50" viewBox="0 0 47 50" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <rect x="0.5" y="1" width="46" height="48" rx="4" fill="#433FFA" />
//                     <rect x="0.5" y="1" width="46" height="48" rx="4" stroke="#433FFA" stroke-linejoin="bevel" />
//                     <path fill-rule="evenodd" clip-rule="evenodd" d="M30.8814 24.0836L15.786 17.1726C15.3915 16.963 14.9089 16.9431 14.4952 17.1194C14.0815 17.2957 13.7897 17.6456 13.7148 18.0552C13.72 18.1913 13.7561 18.3249 13.8209 18.4477L16.695 24.7566C16.8392 25.1756 16.9177 25.6109 16.9282 26.0497C16.9178 26.4886 16.8393 26.9239 16.695 27.3428L13.8209 33.6518C13.7561 33.7746 13.72 33.9082 13.7148 34.0443C13.7902 34.4533 14.0819 34.8025 14.4952 34.9785C14.9085 35.1545 15.3905 35.1347 15.7846 34.9256L30.8814 28.0147C31.7233 27.6594 32.2618 26.8926 32.2618 26.0491C32.2618 25.2057 31.7233 24.4389 30.8814 24.0836V24.0836Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
//                 </svg>
//             </div>
//     </div>
//   )
// }

// export default QuickChat