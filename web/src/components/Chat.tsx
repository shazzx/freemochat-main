import { ChevronLeft, Copy, Delete, DeleteIcon, EllipsisIcon, File, Image, Video } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker, { Categories } from "emoji-picker-react";
import { MdCancel, MdDelete } from "react-icons/md";
import { axiosClient } from "@/api/axiosClient";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "./ui/button";
import VideoCallRecepient from "./Call/Video/VideoCallRecepient";
import VideoCallCaller from "./Call/Video/VideoCallCaller";
import AudioCallCaller from "./Call/Audio/AudioCallCaller";
import { DropdownUser } from "./Dropdowns/DropdownUser";
import { useChatGroup, useCreateMessage, useMessages, useUpdateChatGroup } from "@/hooks/Chat/main";
import { useInView } from "react-intersection-observer";
import AudioRecorder from "./MediaRecorder";
import AudioPlayer from "@/AudioPlayer";
import { FaFilePdf } from 'react-icons/fa'
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useSocket } from "@/hooks/useSocket";
import CreateChatGroup from "@/models/CreateChatGroup";
import { toast } from "react-toastify";
import { handleFile } from "@/lib/formatChec";
import { startCall } from "@/app/features/user/callSlice";
import { CallStates, CallTypes } from "@/utils/enums/global.c";
import { format } from "date-fns";
import { AlertDialogC } from "./AlertDialog";
import Agora from "./Call/agora/AgoraRTC";
import VideoCall from "./Call/Video/VideoCall";

function Chat({ user, recepientDetails, setChatOpen }) {
    const _isOnline = useCallback((online: boolean) => () => setIsOnline(online), [])

    const [emojiPickerState, setEmojiPickerState] = useState(false)
    const socket = useSocket(recepientDetails?.userId || recepientDetails?.groupId, _isOnline)
    const group: any = recepientDetails?.groupId ? useChatGroup(recepientDetails?.groupId) : {}
    const [chatGroupInfo, setChatGroupInfo] = useState(false)
    const [inputValue, setInputValue] = useState("");
    const [groupData, setGroupData] = useState(null)
    const chatContainerRef = useRef(null)
    const [isRecording, setIsRecording] = useState(false)

    const [videoCallState, setVideoCallState] = useState("NEUTRAL")
    const [videoCallCallerState, setVideoCallCallerState] = useState(false)

    const { ref, inView } = useInView()

    const [audioCallState, setAudioCallState] = useState("NEUTRAL")
    const [audioCallCallerState, setAudioCallCallerState] = useState(false)
    const [callDetails, setCallDetails] = useState(null)
    // const [callAccept, setCallAccept] = useState()
    const [openedDropDownMessageId, setOpenedDropDownMessageId] = useState(null)
    const [dropDownMessageId, setDropDownMessageId] = useState(null)
    const [dropDownMessageIndex, setDropDownMessageIndex] = useState(null)
    const [dropDownMessagePageIndex, setDropDownMessagePageIndex] = useState(null)
    const [fileSelectDropDownState, setFileSelectDropDownState] = useState(false)
    const [openPdf, setOpenPdf] = useState(false)
    const dropdownRef = useRef(null)
    const textRef = useRef(null)
    const emojiPickerRef = useRef(null)
    const queryClient = useQueryClient()


    // useEffect(() => {
    //     function handleClickOutside(event) {
    //         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
    //             setFileSelectDropDownState(false);
    //         }
    //     }

    //     // Add event listener when dropdown is open
    //     if (fileSelectDropDownState) {
    //         document.addEventListener('mousedown', handleClickOutside);
    //     }

    //     // Clean up the event listener
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, [fileSelectDropDownState])

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setEmojiPickerState(false);
            }
        }

        // Add event listener when dropdown is open
        if (emojiPickerState) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [emojiPickerState])
    // messages and groups
    const messagesDetails = recepientDetails?.groupId ? { recepientId: recepientDetails?.groupId, isChatGroup: 1 } : { recepientId: recepientDetails?.userId, isChatGroup: 0 }
    const createMessage = useCreateMessage(recepientDetails?.userId || recepientDetails?.groupId)
    const userMessages = useMessages(messagesDetails)



    const joinGroup = async () => {
        socket.emit("joingroup", { userId: user?._id, groupId: recepientDetails?.groupId })
    }

    const leaveGroup = async () => {
        socket.emit("leavegroup", { userId: user?._id, groupId: recepientDetails?.groupId })
    }

    const [isOnline, setIsOnline] = useState(null)

    // useEffect(() => {


    // listen chat event messages
    // socket.on("chat", (newMessage) => {
    //     console.log(newMessage)
    // queryClient.invalidateQueries({queryKey: ["messages", recepientDetails.userId]})

    // queryClient.setQueryData(["messages", recepientDetails.userId], (pages: any) => {
    //     const updatedMessages = produce(pages, (draft: any) => {
    //         if (draft.pages[draft.pages.length - 1].messages) {
    //             draft.pages[draft.pages.length - 1].messages.push({
    //                 recepient: newMessage?.recepientDetails?.userId,
    //                 sender: newMessage?.senderDetails?.targetId,
    //                 content: newMessage?.body,
    //                 // type: newMessage?.type
    //             })
    //             return draft
    //         }
    //         throw new Error()
    //     })
    //     return updatedMessages
    // });
    // setMessages((previousMessages) => [
    // ...previousMessages,
    // ]);
    // });

    // remove all event listeners
    // return () => {
    // socket.off("connect");
    // socket.off("disconnect");
    // socket.off("chat");
    // };
    // }, []);



    // useEffect(() => {
    //     console.log('inview')
    //     if (userMessages?.data[0]?.nextCursor !== null ) {
    //         console.log('true fetching...')
    //         console.log(userMessages.data.nextCursor)
    //         userMessages.fetchPreviousPage()
    //     }
    // }, [inView])

    const scrollToBottom = () => {
        console.log(userMessages.data.length, 'length')
        if (userMessages.data.length == 1) {
            console.log('scrolling...')
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [userMessages.data])


    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const longPressTimer = useRef(null);
    const longPressDuration = 500; // milliseconds

    const handleTouchStart = useCallback((id) => {
        longPressTimer.current = setTimeout(() => {
            setSelectedMessageId(id);
        }, longPressDuration);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    }, []);

    const deleteSelectedMessage = () => {
        if (selectedMessageId !== null) {
            deleteMessage(selectedMessageId)
            setSelectedMessageId(null);
        }
    };


    const handleSendMessage = (e?: KeyboardEvent) => {
        if (inputValue.trim().length === 0) {
            return;
        }

        queryClient.invalidateQueries({ queryKey: ['chatlist'] })

        if (e.type !== "click" && e.key !== "Enter") {
            return
        }
        const messageData = { recepeint: recepientDetails.type == "ChatGroup" ? recepientDetails.groupId : recepientDetails.userId, sender: user?._id, content: inputValue, type: recepientDetails?.type, messageType: "Text" }

        queryClient.setQueryData(["messages", recepientDetails.userId], (pages: any) => {
            const updatedMessages = produce(pages, (draft: any) => {
                console.log(pages)
                if (!pages) {
                    draft = { pages: [{ messages: [messageData] }], nextCursor: null }
                    return draft
                }
                if (draft.pages[draft.pages.length - 1].messages) {
                    draft.pages[draft.pages.length - 1].messages = [...draft.pages[draft.pages.length - 1].messages, messageData]
                    return draft
                }
                throw new Error()
            })
            return updatedMessages
        });


        if (recepientDetails.type == "ChatGroup") {
            socket.emit("groupchat", { senderDetails: { targetId: user?._id, username: user?.username }, messageType: "Text", body: inputValue, recepientDetails: { ...recepientDetails, targetId: messageData.recepeint } });
            setInputValue("");
            return
        }
        socket.emit("chat", { senderDetails: { targetId: user?._id, username: user?.username }, messageType: "Text", body: inputValue, recepientDetails: { ...recepientDetails, groupName: recepientDetails.name, targetId: messageData.recepeint } });
        setInputValue("");
    };

    const dispatch = useAppDispatch()
    const callData = useAppSelector((state) => state.call)

    // audio / video calling
    const initiateAudioCall = useCallback(() => {
        dispatch(startCall(
            {
                onCall: true,
                type: CallTypes.AUDIO,
                callerState: CallStates.CALLING,
            }
        ))
        socket.emit("initiate-call", { type: 'AUDIO', userDetails: { userId: user?._id, username: user?.username, fullname: user?.firstname + " " + user?.lastname, profile: user?.profile }, recepientDetails })
    }, [])


    const initiateVideoCall = useCallback(() => {
        dispatch(startCall(
            {
                onCall: true,
                type: CallTypes.VIDEO,
                callerState: CallStates.CALLING,
                targetDetails: recepientDetails,
            }
        ))
        socket.emit("initiate-call", { type: 'VIDEO', userDetails: { userId: user?._id, username: user?.username, fullname: user?.firstname + " " + user?.lastname, profile: user?.profile }, recepientDetails })
    }, [])

    // chat method
    const deleteMessage = async (messageId) => {
        const { data } = await axiosClient.post("/messages/remove", { messageId })
        console.log(data)
    }

    const deleteChat = async () => {
        const { data } = await axiosClient.post("/chatlist/remove", { recepientId: recepientDetails?.type == "ChatGroup" ? recepientDetails?.groupId : recepientDetails?.userId, type: recepientDetails?.type })
        console.log(data)
        setChatOpen(false)
    }

    const handleMediaLoad = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
        const media = event.currentTarget;
        media.classList.remove('blur-md');
        media.classList.add('blur-none');
        
        // const loadingIndicator = media.parentElement?.querySelector('.loading-indicator');
        // if (loadingIndicator) {
        //   loadingIndicator.remove();
        // }
      };

    const blockUser = async () => {
        alert('under development')
        // const {data} = await axiosClient.post("/user/block", {blockUserId: recepientDetails?.userId})
        // console.log(data)
    }

    function emojiToImageUrl(emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;  
        canvas.height = 32;

        const ctx = canvas.getContext('2d');

        ctx.font = '24px Arial';  
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL();
    }

    // Chat Group

    const updateGroup = useUpdateChatGroup()

    const editGroup = async ({ groupData, imageUpload, coverImageUpload }) => {

        if (updateGroup.isPending) {
            toast.info('please wait...')
            return
        }

        let images;
        if (imageUpload) {
            images = { profile: URL.createObjectURL(imageUpload) }
        }
        if (coverImageUpload) {
            images = { ...images, cover: URL.createObjectURL(coverImageUpload) }
        }
        let formData = new FormData()
        imageUpload && formData.append("files", imageUpload, 'profile')
        coverImageUpload && formData.append("files", coverImageUpload, 'cover')
        formData.append("groupData", JSON.stringify({ groupDetails: { ...groupData }, groupId: recepientDetails.groupId, images: recepientDetails.images }))
        console.log(groupData)

        updateGroup.mutate({ updatedGroupDetails: groupData, images, formData })
        setChatGroupInfo(false)
    }

  const { callerState, onCall, recepientState, targetDetails, type } = useAppSelector((state) => state.call)
  const [alertDialog, setAlertDialog] = useState(false)

    return (
        <div className='flex flex-col min-w-[380px] h-full w-full' >
            {chatGroupInfo &&
                <CreateChatGroup setModelTrigger={setChatGroupInfo} groupDetails={recepientDetails} editState={true} editGroup={editGroup} />
            }

            {/* initiated call */}
            {/* {videoCallCallerState &&
                <VideoCallCaller recepientDetails={recepientDetails} setVideoCallCallerState={setVideoCallCallerState} />
            } */}



            {/* incoming call */}
            {/* {videoCallState == "CALLING"
                &&
                <VideoCallRecepient recepientDetails={recepientDetails} setVideoCallState={setVideoCallState} />
            } */}

            {/* initiated call */}
            {callData?.onCall && callData?.type == "Audio" && callData?.callerState == "CALLING" &&
                <AudioCallCaller recepientDetails={recepientDetails} setAudioCallCaller={setAudioCallCallerState} />
            }

            <AlertDialogC action={deleteChat} alertDialog={alertDialog} setAlertDialog={setAlertDialog} />

            <div className='flex items-center justify-between p-3 border border-muted'>
                <div className='flex gap-2 items-center justify-center'>
                    <ChevronLeft cursor="pointer" onClick={() => setChatOpen(false)} />
                    <div className='w-10 h-10 rounded-full flex items-center justify-center bg-accent overflow-hidden'>
                        {recepientDetails?.type == "User" ? <Avatar className="h-10 w-10 flex items-center justify-center">
                            <AvatarImage src={recepientDetails?.profile} alt="Avatar" />
                            <AvatarFallback>{recepientDetails?.firstname[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                            :
                            <Avatar className="h-10 w-10 flex items-center justify-center" onClick={() => {
                                setChatGroupInfo(true)
                            }}>
                                <AvatarImage src={recepientDetails?.images?.profile} alt="Avatar" />
                                <AvatarFallback>{recepientDetails?.name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        }
                    </div>
                    <div className='flex flex-col gap-0'>
                        <h3 className='text-card-foreground text-sm'>{recepientDetails?.type == "User" ? recepientDetails?.fullname : recepientDetails?.name}</h3>
                        <span className='text-muted-foreground text-xs'>{recepientDetails?.type == "ChatGroup" ? group?.data?.membersCount > 0 ? "members " + group?.data?.membersCount : "no members" : isOnline == null ? recepientDetails.onlineStatus ? "online" : "offline" : isOnline ? "online" : "offline"}</span>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4 sm:mr-4">
                    {recepientDetails?.type == "User" && <div className="flex gap-2 items-center justify-center">
                        {/* phone call icon */}
                        <svg onClick={initiateAudioCall} width="22" height="26" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.564993 8.86603C0.0381881 7.61424 -0.0416895 6.21917 0.338876 4.9154C0.71962 3.61168 1.53755 2.47875 2.65534 1.70719L3.60324 1.02748C4.03508 0.732367 4.56517 0.617962 5.08019 0.708775C5.59522 0.799588 6.0544 1.08843 6.35907 1.51341L9.19392 5.60762C9.48843 6.03612 9.60287 6.56315 9.51258 7.07521C9.42229 7.58726 9.1345 8.04337 8.7112 8.34529C8.28618 8.65009 7.99736 9.10916 7.90654 9.62422C7.81572 10.1393 7.93012 10.6694 8.22526 11.1012L12.7351 17.542C12.8829 17.7564 13.0719 17.9393 13.291 18.08C13.5101 18.2207 13.755 18.3164 14.0114 18.3617C14.2679 18.4069 14.5307 18.4007 14.7848 18.3434C15.0388 18.2861 15.2789 18.1789 15.4911 18.0279C15.9196 17.7334 16.4466 17.619 16.9586 17.7093C17.4707 17.7996 17.9268 18.0874 18.2287 18.5107L21.085 22.5898C21.3801 23.0216 21.4945 23.5517 21.4037 24.0668C21.3129 24.582 21.0241 25.041 20.599 25.3458L19.6361 26.0041C18.5288 26.7904 17.1845 27.1715 15.8291 27.0834C14.4738 26.9953 13.1902 26.4431 12.1941 25.5197C7.29234 20.7599 3.34525 15.1073 0.564993 8.86603Z" fill="#433FFA" />
                        </svg>

                        {/* video icon */}
                        <svg onClick={initiateVideoCall} width="26" height="19" viewBox="0 0 26 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24.64 3.43994L19 5.93994V2.93994C19 2.4095 18.7892 1.9008 18.4142 1.52572C18.0391 1.15066 17.5304 0.939941 17 0.939941H1.99997C1.46953 0.939941 0.960829 1.15066 0.585755 1.52572C0.210683 1.9008 -3.05176e-05 2.4095 -3.05176e-05 2.93994V16.9399C-3.05176e-05 17.4703 0.210683 17.9791 0.585755 18.3541C0.960829 18.7291 1.46953 18.9399 1.99997 18.9399H17C17.5304 18.9399 18.0391 18.7291 18.4142 18.3541C18.7892 17.9791 19 17.4703 19 16.9399V13.9399L24.64 16.4399C24.792 16.4985 24.9562 16.5193 25.118 16.4999C25.2798 16.4807 25.4346 16.4223 25.5686 16.3295C25.7026 16.2369 25.812 16.1129 25.8872 15.9683C25.9624 15.8237 26.0012 15.6629 26 15.4999V4.37994C26.0012 4.21696 25.9624 4.05616 25.8872 3.91156C25.812 3.76696 25.7026 3.64292 25.5686 3.55026C25.4346 3.45758 25.2798 3.3991 25.118 3.37986C24.9562 3.36064 24.792 3.38126 24.64 3.43994Z" fill="#433FFA" />
                        </svg>
                    </div>}
                    <DropdownUser setAlertDialog={setAlertDialog} deleteChat={deleteChat} blockUser={blockUser} />
                </div>
            </div>

            <div className="h-full px-4 flex flex-col gap-4  overflow-y-scroll" onClick={() => {

                if (openedDropDownMessageId !== null) {
                    setOpenedDropDownMessageId(null)
                }
            }} ref={chatContainerRef}>
                {!userMessages.isLoading && userMessages.data[0].nextCursor !== null && <Button className="relative m-1 w-fit bg-card text-xs mx-auto" ref={ref} onClick={() => {
                    userMessages.fetchPreviousPage()
                }}>Load More</Button>}
                {/* <div className="w-full text-center pb-4">
                    <span>Today</span>
                </div> */}

                {/* user */}

                {!userMessages.isLoading && userMessages.data?.map((page, pageIndex) => {
                    return page.messages.map((message, messageIndex) => {
                        if (message?.deletedFor?.length > 0) {
                            const isDeleted = message?.deletedFor?.filter((deleted) => {
                                if (deleted?.userId == user?._id) {
                                    return deleted
                                }
                            })
                            if (isDeleted?.[0]?.userId == user?._id) {
                                return (
                                    <div className="flex gap-2 justify-end" key={message?._id}>

                                        <div className="relative max-w-80 w-fit">

                                            <div className="relative border border-muted
                                     text-sm bg-card p-1 text-foreground rounded-lg pr-3" onMouseEnter={() => setDropDownMessageId(message?._id)} onMouseLeave={() => setDropDownMessageId(null)}>
                                                <p className="" >message deleted</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        }

                        if (message?.messageType == 'Info') {
                            return (
                                <div className="flex gap-2 items-center justify-center w-full" key={message?._id}>

                                    <div className="relative max-w-80 w-fit">
                                        <p className="p-1 px-2 text-xs" >{format(message?.createdAt ?? Date.now(), 'MMM d, yyy h:mm a')}</p>
                                        <div className="relative border border-muted
                                 text-sm bg-card p-1 text-foreground rounded-lg pr-3">
                                            <p className="p-1 px-2 text-center" >{message?.content}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return (
                            (message?.sender == user._id || message?.sender?._id == user._id) ?
                                <div className="flex gap-2 justify-end" key={message?._id}>
                                    {/* {userMessages.data.length - 1 == pageIndex && (pageIndex == 0 && messageIndex == 0) && <div ref={ref}></div>} */}
                                    <div className="relative max-w-80 w-fit">
                                        <div className={`relative ${!message?.media ? selectedMessageId == message._id ? "bg-card p-2 pr-3" : "p-2 pr-3 bg-primary" : "p-0"} ${selectedMessageId == message._id && "bg-card"} select-none border border-muted text-sm  text-primary-foreground rounded-lg `}
                                            onTouchStart={() => handleTouchStart(message._id)}
                                            onTouchEnd={handleTouchEnd}
                                            onMouseDown={() => handleTouchStart(message._id)}
                                            onMouseUp={handleTouchEnd}
                                            onMouseLeave={handleTouchEnd}
                                        // onMouseEnter={() => {
                                        // setDropDownMessageIndex(messageIndex)
                                        // setDropDownMessagePageIndex(pageIndex)
                                        // setDropDownMessageId(message?._id || null)
                                        // }} onMouseLeave={() => {
                                        // setDropDownMessageIndex(null)
                                        // setDropDownMessagePageIndex(null)
                                        // setDropDownMessageId(null)
                                        // }}
                                        >
                                            {message?.media && message.media.type == "audio" &&
                                                <AudioPlayer src={message.media.url} duration={message.media.duration} />
                                            }
                                            {message?.media && message.media.type == "image" &&
                                                <div className="relative aspect-auto max-w-64 sm:max-w-96">
                                                    <img src={message.media.url} alt=""  onLoad={handleMediaLoad}/>
                                                    {message.media.isUploaded == false &&
                                                        <div className='bg-card flex gap-4 p-2 blur-md w-full' >
                                                            <svg className="text-gray-700 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
                                                                width="20" height="20">
                                                                <path
                                                                    d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                                                                    stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
                                                                <path
                                                                    d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                                                                    stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                                                                </path>
                                                            </svg>
                                                            Sending Image...
                                                        </div>
                                                    }
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
                                             {/* {
                                                (dropDownMessagePageIndex == pageIndex && dropDownMessageIndex == messageIndex && message?._id == dropDownMessageId) &&
                                                <div className="cursor-pointer absolute top-0 -right-2" onClick={() => {
                                                    setOpenedDropDownMessageId(message?._id)
                                                }}>
                                                    <EllipsisIcon />
                                                </div>

                                            } */}
                                            {
                                                 message?._id == selectedMessageId &&
                                                <div className="absolute top-10 right-0 z-20">
                                                    <Button className="bg-card border border-accent" onClick={() => {
                                                        message?.deletedFor.push({ userId: user?._id })
                                                        deleteSelectedMessage()
                                                    }}><MdDelete size={20} className="mr-2"/> Delete</Button>
                                                </div>
                                            } 
                                        </div>
                                    </div>
                                    <div className='max-w-10 max-h-10 rounded-full overflow-hidden'>

                                    </div>
                                </div>
                                :

                                <div className="flex" key={message?._id}>
                                    {/* {userMessages.data.length - 1 == pageIndex && userMessages.data[userMessages.data.length - 1].messages.length - 1 == messageIndex && <div ref={ref}></div>} */}
                                    <div className="flex gap-2">
                                        <div className='max-w-10 max-h-10 bg-accent rounded-full overflow-hidden'>
                                            <Avatar className="h-9 w-9 flex items-center justify-center">
                                                <AvatarImage src={message?.sender?.profile || recepientDetails?.profile} alt="Avatar" />
                                                <AvatarFallback>
                                                    {message?.sender?.firstname ? message?.sender?.firstname[0]?.toUpperCase()
                                                        ||
                                                        recepientDetails?.firstname[0]?.toUpperCase()
                                                        :
                                                        recepientDetails?.firstname[0]?.toUpperCase() || recepientDetails?.firstname[0]?.toUpperCase()

                                                    }</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="relative max-w-80 w-fit">
                                            <div className="relative p-2 border border-muted text-sm text-foreground rounded-lg pl-3"

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

            {recepientDetails?.type == "group" && !groupData?.members?.includes(user?._id) && <Button type="button" onClick={joinGroup}>JOIN ROOM</Button>}
            {recepientDetails?.type == "group" && groupData?.members?.includes(user?._id) && <Button type="button" onClick={leaveGroup}>Leave</Button>

            }
            <div className="flex gap-2 items-center justify-center p-2 flex-1">
                {!isRecording && <div className="flex  items-center justify-center border border-primary h-11 rounded-md p-2 w-full">

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
                    }

                    <input className="hidden" type="file" accept='application/pdf' id='text-pdf' onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            let file = await handleFile(e.target.files[0])
                            if (!file) {
                                return
                            }
                            const formData = new FormData()
                            const messageData = { recepient: recepientDetails?.type == "ChatGroup" ? recepientDetails.groupId : recepientDetails.userId, sender: user?._id, content: inputValue, messageType: "PDF", type: recepientDetails?.type, mediaDetails: { type: "pdf", } }
                            formData.append("messageData", JSON.stringify(messageData))
                            formData.append("file", file, 'pdf')
                            console.log(messageData, recepientDetails)

                            createMessage.mutate({ messageData: { ...messageData, media: { type: "pdf", url: URL.createObjectURL(file), isUploaded: false } }, formData })
                            scrollToBottom()
                            setFileSelectDropDownState(false)
                        }
                    }} />

                    <input className="hidden" type="file" accept='image/*' id='text-image' onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            let file = await handleFile(e.target.files[0])
                            if (!file) {
                                return
                            }
                            const formData = new FormData()
                            const url = URL.createObjectURL(file)
                            const messageData = { recepient: recepientDetails?.type == "ChatGroup" ? recepientDetails.groupId : recepientDetails.userId, sender: user?._id, content: inputValue, localUrl: url, messageType: "Image", type: recepientDetails?.type, mediaDetails: { type: "image", } }
                            formData.append("messageData", JSON.stringify(messageData))
                            formData.append("file", file, 'image')

                            createMessage.mutate({ messageData: { ...messageData, media: { type: "image", url, isUploaded: false } }, formData })
                            scrollToBottom()
                            setFileSelectDropDownState(false)
                        }
                    }} />

                    <input className="hidden" type="file" accept='video/*' id='text-video' onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            let file = await handleFile(e.target.files[0])
                            if (!file) {
                                return
                            }
                            const formData = new FormData()
                            const messageData = { recepient: recepientDetails?.type == "ChatGroup" ? recepientDetails.groupId : recepientDetails.userId, sender: user?._id, content: inputValue, messageType: "Video", type: recepientDetails?.type, mediaDetails: { type: "video", } }
                            formData.append("messageData", JSON.stringify(messageData))
                            formData.append("file", file, 'video')
                            console.log(messageData, recepientDetails)


                            createMessage.mutate({ messageData: { ...messageData, media: { type: "video", url: URL.createObjectURL(file), isUploaded: false } }, formData })
                            scrollToBottom()

                            setFileSelectDropDownState(false)
                        }
                    }} />

                    <input
                        ref={textRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e: any) => {
                            handleSendMessage(e)
                        }}
                        type="search"
                        placeholder="Type your message..."
                        className="w-full appearance-none bg-background-secondary pl-8 shadow-none border-none focus:outline-none"
                    />

                    <div className="relative">
                        {<div onClick={() => {
                            setEmojiPickerState(true)
                        }}>
                            <img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f604.png" height="26px" width="26px" alt="" />
                        </div>}

                        {emojiPickerState && <div ref={emojiPickerRef} className="absolute bottom-12 -right-12">
                            <MdCancel onClick={() => {
                                setEmojiPickerState(false)
                            }} />

                            <EmojiPicker categories={[
                                { category: Categories.SUGGESTED, name: 'suggested' },
                                { category: Categories.CUSTOM, name: "Freedom" },
                                { category: Categories.SMILEYS_PEOPLE, name: 'smileys_people' },
                                { category: Categories.ANIMALS_NATURE, name: 'animals_nature' },
                                { category: Categories.FOOD_DRINK, name: 'food_drink' },
                                { category: Categories.TRAVEL_PLACES, name: 'travel_places' },
                                { category: Categories.ACTIVITIES, name: 'activities' },
                                { category: Categories.OBJECTS, name: 'objects' },
                                { category: Categories.SYMBOLS, name: 'symbols' },
                                { category: Categories.FLAGS, name: 'flags' },
                            ]}
                                customEmojis={[
                                    { id: '12rwtfadfasdf', names: ['freedom'], imgUrl: emojiToImageUrl('🪽') },
                                    // { id: '1adf2asfsdf4', names: ['freedom'], imgUrl: emojiToImageUrl('𓆩𓆪') },
                                    { id: '1asftujyyiz2623', names: ['freedom'], imgUrl: emojiToImageUrl('🕊️') }
                                ]} open={emojiPickerState} onEmojiClick={({ emoji, names }) => {
                                    let selection = textRef.current.selectionStart
                                    console.log(emoji)
                                    let _emoji = emoji
                                    if (emoji == "1asftujyyiz2623") {
                                        _emoji = '🕊️'
                                    }
                                    if (emoji == "12rwtfadfasdf") {
                                        _emoji = '🪽'
                                    }
                                    console.log(selection)


                                    if (selection == 0 && inputValue.length == 0) {
                                        setInputValue(_emoji)
                                        return
                                    }

                                    if (selection) {
                                        const textBefore = inputValue.substring(0, selection);
                                        const textAfter = inputValue.substring(selection);
                                        setInputValue(textBefore + _emoji + textAfter)

                                        const newCursorPos = selection + emoji.length;
                                        console.log(newCursorPos)
                                        textRef.current.setSelectionRange(newCursorPos, newCursorPos);

                                    }
                                }} />
                        </div>
                        }
                    </div>
                </div>}
                <AudioRecorder setIsRecordingMain={setIsRecording} onRecordingComplete={async (audioBlob, uploadState, recordingTime) => {
                    console.log(audioBlob, uploadState, recordingTime)
                    if (uploadState) {
                        const formData = new FormData()
                        const messageData = { recepient: recepientDetails?.type == "ChatGroup" ? recepientDetails.groupId : recepientDetails.userId, sender: user?._id, content: inputValue, type: recepientDetails?.type, messageType: "Voice", mediaDetails: { type: "audio", duration: recordingTime } }
                        formData.append("messageData", JSON.stringify(messageData))
                        formData.append("file", audioBlob, 'voice')
                        createMessage.mutate({ messageData: { ...messageData, media: { type: "audio", url: URL.createObjectURL(audioBlob), duration: recordingTime } }, formData })
                    }

                }} />
                {!isRecording &&
                    <Button className="p-0 m-0 bg-transparent" onClick={() => {
                        handleSendMessage()
                    }}>

                        <svg width="47" className="stroke-white" cursor="pointer" height="50" viewBox="0 0 47 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.5" y="1" width="46" height="48" rx="4" fill="#433FFA" />
                            <rect x="0.5" y="1" width="46" height="48" rx="4" stroke="#433FFA" stroke-linejoin="bevel" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M30.8814 24.0836L15.786 17.1726C15.3915 16.963 14.9089 16.9431 14.4952 17.1194C14.0815 17.2957 13.7897 17.6456 13.7148 18.0552C13.72 18.1913 13.7561 18.3249 13.8209 18.4477L16.695 24.7566C16.8392 25.1756 16.9177 25.6109 16.9282 26.0497C16.9178 26.4886 16.8393 26.9239 16.695 27.3428L13.8209 33.6518C13.7561 33.7746 13.72 33.9082 13.7148 34.0443C13.7902 34.4533 14.0819 34.8025 14.4952 34.9785C14.9085 35.1545 15.3905 35.1347 15.7846 34.9256L30.8814 28.0147C31.7233 27.6594 32.2618 26.8926 32.2618 26.0491C32.2618 25.2057 31.7233 24.4389 30.8814 24.0836V24.0836Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </Button>
                }
            </div>
        </div >
    )
}

export default memo(Chat)