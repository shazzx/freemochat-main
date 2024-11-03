import { acceptCall, callRinging, endCall, incomingCall, startCall } from "@/app/features/user/callSlice";
import { setNewNotification } from "@/app/features/user/notificationSlice";
import { setOffline, setOnline } from "@/app/features/user/onlineSlice";
import { setSocket } from "@/app/features/user/socketSlice";
import { useAppSelector } from "@/app/hooks";
import { CallStates, CallTypes } from "@/utils/enums/global.c";
import { socketConnect } from "@/websocket/socket.io";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export const useSocket = (recepient?: string, _isOnline?: Function) => {
  const queryClient = useQueryClient();
  const { user } = useAppSelector(state => state.user)
  const socket = socketConnect(user && user.username)
  const socketRef = useRef(socket);
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = socketRef.current;
    dispatch(setSocket(socket))

    socket.on('chat', (message) => {
      if (message?.success == false) {
        toast.error(message?.message)
      }

      console.log(message, 'new message')
      let newMessage = {
        _id: message?._id,
        recepient: message?.recepientDetails?.userId,
        sender: message?.senderDetails?.userId,
        content: message?.body,
        media: message?.media,
        type: message?.type
      }
      queryClient.setQueryData(["messages", recepient], (pages: any) => {
        const updatedMessages = produce(pages, (draft: any) => {
          if (!draft) {
            return null
          }

          let pageIndex = -1
          let messageIndex = -1

          draft.pages.forEach((page, _pageIndex) => {
            page.messages.forEach((message, _messageIndex) => {
              if (message._id == newMessage._id) {
                pageIndex = _pageIndex
                messageIndex = _messageIndex
              }
            })
          })

          console.log(pageIndex, 'pageindex', messageIndex, 'messageindex')

          if (pageIndex > -1 && messageIndex > -1) {
            return draft
          }

          if (draft.pages[draft.pages.length - 1].messages) {
            draft.pages[draft.pages.length - 1].messages = [...draft.pages[draft.pages.length - 1].messages, newMessage]
            return draft
          }
          console.log(pages)
          throw new Error()
        })
        return updatedMessages
      });

    });

    socket.on('groupchat', (message) => {
      console.log(message, 'groupmessage')
      if (message?.success == false) {
        toast.error(message?.message)
      }

      // console.log(message, 'new message')
      let newMessage = {
        _id: message?._id,
        recepient: message?.recepientDetails?.groupId,
        sender: message?.senderDetails,
        content: message?.body,
        media: message?.media,
        type: message?.type
      }
      // console.log(newMessage)
      if (newMessage.sender.username == user.username) {
        return
      }
      queryClient.invalidateQueries({ queryKey: ['chatlist'] })

      // queryClient.invalidateQueries({queryKey: ['messages', recepient]})
      queryClient.setQueryData(["messages", recepient], (pages: any) => {
        const updatedMessages = produce(pages, (draft: any) => {
          if (!draft) {
            return null
          }

          let pageIndex = -1
          let messageIndex = -1

          draft.pages.forEach((page, _pageIndex) => {
            page.messages.forEach((message, _messageIndex) => {
              if (message._id == newMessage._id) {
                console.log('yes exists')
                pageIndex = _pageIndex
                messageIndex = _messageIndex
              }
            })
          })

          console.log(pageIndex, 'pageindex', messageIndex, 'messageindex')

          if (pageIndex > -1 && messageIndex > -1) {
            return draft
          }

          if (draft.pages[draft.pages.length - 1].messages) {
            draft.pages[draft.pages.length - 1].messages = [...draft.pages[draft.pages.length - 1].messages, newMessage]
            return draft
          }
          console.log(pages)
          throw new Error()
        })
        return updatedMessages
      });

    });

    // socket.on("group-error", (data) => {
    //   console.log(data)
    //   toast.error(data.message)
    // })

    socket.on('toggleJoin', (data) => {
      console.log(data)
      queryClient.invalidateQueries({ queryKey: ["chatlist"] })
      queryClient.invalidateQueries({ queryKey: ["messages", data.groupId] })
    })

    // socket.on("users", (users) => {
    //   console.log(users)
    // })

    // socket.on("getOnlineFriends", (onlineFriends) => {
    //   console.log(onlineFriends)
    // })

    socket.on("upload-status", (data) => {
      console.log(data, 'upload status')
      if (data.isSuccess) {
        console.log('upload-success')
      } else {
        toast.error(data.target?.error?.message || "something went wrong try agan later")
      }

      if (data.target?.invalidate == "posts") {
        const { targetId } = data?.target
        if (data.isSuccess) {
          toast.success(data?.target?.isUpdate ? "Post Updated" : "Post created")
        }



        queryClient.invalidateQueries({ queryKey: [data.target.type + "Posts", targetId] })
        queryClient.invalidateQueries({ queryKey: [data.target.type + "Media", targetId] })
        queryClient.invalidateQueries({ queryKey: ['feed'] })

      }

      if (data.isSuccess && data.target.type == "page") {
        // const {targetId} = data.target
        queryClient.invalidateQueries({ queryKey: ['page'] })
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        return
      }


      if (data.isSuccess && data.target.type == "messages") {
        const { targetId } = data.target
        console.log('messages cond')
        queryClient.invalidateQueries({ queryKey: ['messages', targetId] })
        return
      }

      if (data.isSuccess && data.target.type == "group") {
        // const {targetId} = data.target
        queryClient.invalidateQueries({ queryKey: ['group'] })
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        return
      }

      queryClient.invalidateQueries({ queryKey: ['userPosts', user._id] })
      queryClient.invalidateQueries({ queryKey: ['userMedia', user._id] })
    })

    socket.on("chatlist", () => {
      queryClient.invalidateQueries({ queryKey: ['chatlist'] })
    })

    socket.on("friendStatus", (data) => {
      if (data?.isOnline && data?.friendId) {
        dispatch(setOnline(data.friendId))
        queryClient.invalidateQueries({ queryKey: ['chatlist'] })
      } else {
        dispatch(setOffline(data.friendId))
        queryClient.invalidateQueries({ queryKey: ['chatlist'] })
      }
    })

    socket.on("notification", (data) => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      // dispatch(setNewNotification())
    })
    socket.on("request", (data) => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      queryClient.invalidateQueries({ queryKey: ['userRequests', user._id] })
    })
    socket.on("initiate-call", (data) => {
      console.log(data)
      if (data.type == 'VIDEO') {
        dispatch(incomingCall(
          {
            onCall: true,
            type: CallTypes.VIDEO,
            recepientState: CallStates.CALLING,
            callDetails: data,
          }
        ))
      }
      if (data.type == 'AUDIO') {
        dispatch(incomingCall(
          {
            onCall: true,
            type: CallTypes.AUDIO,
            recepientState: CallStates.CALLING,
            callDetails: data,
          }
        ))
      }
    })
    socket.on("call-ringing", (data) => {
      console.log(data, 'call-ringing')
      dispatch(callRinging())
    })
    socket.on("call-decline", (data) => {
      console.log("decline")
      dispatch(endCall())
    })
    socket.on("call-accept", (data) => {
      console.log(data)
      if (data?.type == "AUDIO") {
        dispatch(acceptCall(
          {
            callDetails: data,
          }
        ))
      } else {
        dispatch(acceptCall(
          {
            callDetails: data,
          }
        ))
      }
    })
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      // socket.off("group-error");
      // socket.off("chat");
      // socket.off("group-chat");
      // socket.off("toggleJoin");
      socket.off("upload-status");
      // socket.off("chatlist");
      socket.off("friendStatus");
      socket.off("notification");
      socket.off("request");
      // socket.off("initiate-call");
      // socket.off("call-decline");
      // socket.off("call-accept");
      // socket.off("friendOnlineStatusChange");
      // socket.off("users");
      // socket.off("getOnlineFriends");
      // socket.off('newMessage');
    };
  }, []);

  return useMemo(() => socketRef.current, []);
}