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
import { MdClose, MdSend } from 'react-icons/md';

function QuickChat({ target, setOpenQuickChat }: any) {
    const { user } = useAppSelector(state => state.user)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState("")
    const recepientDetails = target?.type == "User" ? { targetId: target?.data?._id, username: target?.data?.username, type: "User" } : { targetId: target?.data?._id, username: target?.data?.handle, type: "Page" }
    const { socket } = useAppSelector((state) => state.socket)
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

    const userMessages = useMessages({ recepientId: target?.data?._id, isChatGroup: 0 })
    console.log(userMessages)

    const deleteMessage = async (messageId) => {
        const { data } = await axiosClient.post("/messages/remove", { messageId })
        console.log(data)
    }

    useEffect(() => {
        scrollToBottom()
    }, [userMessages?.data])


    const handleSendMessage = (e) => {
        if (inputValue.trim().length === 0) {
            return;
        }

        if (e?.type !== "click" && e?.key !== "Enter") {
            return
        }

        
        
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
        <div className='absolute z-50 bg-background flex flex-col sm:max-w-[400px]  sm:max-h-[440px] h-full w-full border-2 border-accent bottom-0 sm:bottom-12 sm:right-12 sm:border sm:border-accent sm:shadow-md' >
            <div className='flex items-center justify-between p-3 border border-muted'>
                <div className='flex gap-2 items-center justify-center'>
                    <div className='w-10 h-10 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        {recepientDetails?.type == "User" ? <Avatar className="h-9 w-9 flex items-center justify-center">
                            <AvatarImage src={target?.data?.profile} alt="Avatar" />
                            <AvatarFallback>{target?.data?.firstname[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                            :
                            <Avatar className="h-10 w-10 flex items-center justify-center">
                                <AvatarImage src={target?.data?.profile} alt="Avatar" />
                                <AvatarFallback>{target?.data?.name[0]?.toUpperCase() + target?.data?.name[1]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        }
                    </div>
                    <div className='flex flex-col gap-0'>
                        <h3 className='text-card-foreground text-sm'>{target?.type == "User" ? target?.data?.firstname + " " + target?.data?.lastname : target?.data?.name}</h3>
                        <span className='text-muted-foreground text-xs'>@{target?.type == "User" ? target?.data?.username : target?.data?.handle}</span>
                    </div>
                </div>
                <MdClose size={24} cursor="pointer" onClick={() => {
                    setOpenQuickChat(false)
                }} />

            </div>
            <div className="h-full p-4 flex flex-col gap-4  overflow-y-scroll" onClick={() => {

            }} ref={chatContainerRef}>
                {userMessages?.data[0]?.messages?.length == 0 && <div className="w-full text-center pb-4">
                    No Messages
                </div>}

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
                                <div className="  flex gap-2 justify-end" key={message?._id}>
                                    {userMessages.data.length - 1 == pageIndex && userMessages.data[userMessages.data.length - 1].messages.length - 1 == messageIndex && <div ref={ref}></div>}
                                    <div className="relative max-w-80 w-fit">
                                        <div className={`relative ${!message?.media ? "p-2 pr-3" : "p-0"} border border-muted text-sm bg-primary text-primary-foreground rounded-lg `}
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
                                            <p>{message?.content}</p>
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
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleSendMessage}
                        type="search"
                        placeholder="Type your message..."
                        className="w-full appearance-none bg-background pl-2 shadow-none border-none focus:outline-none"
                    />

                    <div>
                    </div>
                </div>
                <Button className="m-0 bg-transparent  py-5 px-2 border-[2px] border-primary" onClick={handleSendMessage} >
                    <MdSend size={24} className="text-foreground"></MdSend>
                </Button>
            </div>
        </div>
    )
}

export default QuickChat