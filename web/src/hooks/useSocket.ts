import { acceptCall, callRinging, endCall, incomingCall } from "@/app/features/user/callSlice";
import { setSocket } from "@/app/features/user/socketSlice";
import { useAppSelector } from "@/app/hooks";
import { CallStates, CallTypes } from "@/utils/enums/global.c";
import { socketConnect } from "@/websocket/socket.io";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export const useSocket = () => {
  const queryClient = useQueryClient();
  const { user } = useAppSelector(state => state.user)
  const dispatch = useDispatch();
  const socket = socketConnect(user && user.username)
  dispatch(setSocket(socket))

  useEffect(() => {

    socket.on('chat', (message) => {
      if (message?.success == false) {
        toast.error(message?.message)
      }

      let newMessage = {
        uuid: message?.uuid,
        _id: message?._id,
        recepient: message?.recepientDetails?.targetId,
        sender: message?.senderDetails?.targetId,
        content: message?.body,
        media: message?.media,
        type: message?.type
      }

      queryClient.invalidateQueries({ queryKey: ['chatlist'] })

      if (message?.media?.type == 'audio') {
        queryClient.invalidateQueries({ queryKey: ["messages", message?.sender] })
      }


      if (message?.senderDetails?.targetId == user._id) {
        console.log(newMessage, 'self')

        queryClient.setQueryData(["messages", (message?.recepientDetails?.targetId || message?.sender)], (pages: any) => {
          const updatedMessages = produce(pages, (draft: any) => {

            if (!draft) {
              console.log('no doesnot exist', message?.senderDetails?.targetId, message?.sender)
              return null
            }

            let pageIndex = -1
            let messageIndex = -1

            draft.pages.forEach((page, _pageIndex) => {
              page.messages.forEach((message, _messageIndex) => {
                if (message.uuid == newMessage.uuid) {
                  draft.pages[_pageIndex].messages[_messageIndex]._id = newMessage._id
                  pageIndex = _pageIndex
                  messageIndex = _messageIndex
                }
              })
            })

            console.log('yes exist')

            if (pageIndex > -1 && messageIndex > -1) {
              return draft
            }

            console.log(pages)
            throw new Error()
          })
          return updatedMessages
        });
        queryClient.invalidateQueries({ queryKey: ['metrics'] })

        return
      }
      console.log(message)
      // console.log('this is recepient', message?.recepientDetails?.targetId)

      queryClient.setQueryData(["messages", (message?.senderDetails?.targetId || message?.sender)], (pages: any) => {
        const updatedMessages = produce(pages, (draft: any) => {
          console.log(pages)
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

      queryClient.invalidateQueries({ queryKey: ['metrics'] })

    });

    // socket.on('groupchat', (message) => {
    //   console.log(message, 'groupmessage')
    //   if (message?.success == false) {
    //     toast.error(message?.message)
    //   }

    //   // console.log(message, 'new message')
    //   let newMessage = {
    //     _id: message?._id,
    //     recepient: message?.recepientDetails?.groupId,
    //     sender: message?.senderDetails,
    //     content: message?.body,
    //     media: message?.media,
    //     type: message?.type
    //   }
    //   // console.log(newMessage)
    //   if (newMessage.sender.username == user.username) {
    //     return
    //   }
    //   queryClient.invalidateQueries({ queryKey: ['chatlist'] })

    //   // queryClient.invalidateQueries({queryKey: ['messages', recepient]})
    //   queryClient.setQueryData(["messages", recepient], (pages: any) => {
    //     const updatedMessages = produce(pages, (draft: any) => {
    //       if (!draft) {
    //         return null
    //       }

    //       let pageIndex = -1
    //       let messageIndex = -1

    //       draft.pages.forEach((page, _pageIndex) => {
    //         page.messages.forEach((message, _messageIndex) => {
    //           if (message._id == newMessage._id) {
    //             console.log('yes exists')
    //             pageIndex = _pageIndex
    //             messageIndex = _messageIndex
    //           }
    //         })
    //       })

    //       console.log(pageIndex, 'pageindex', messageIndex, 'messageindex')

    //       if (pageIndex > -1 && messageIndex > -1) {
    //         return draft
    //       }

    //       if (draft.pages[draft.pages.length - 1].messages) {
    //         draft.pages[draft.pages.length - 1].messages = [...draft.pages[draft.pages.length - 1].messages, newMessage]
    //         return draft
    //       }
    //       console.log(pages)
    //       throw new Error()
    //     })
    //     return updatedMessages
    //   });

    // });

    // socket.on("group-error", (data) => {
    //   console.log(data)
    //   toast.error(data.message)
    // })

    // socket.on('toggleJoin', (data) => {
    //   console.log(data)
    //   queryClient.invalidateQueries({ queryKey: ["chatlist"] })
    //   queryClient.invalidateQueries({ queryKey: ["messages", data.groupId] })
    // })

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
        queryClient.invalidateQueries({ queryKey: ['messages', data.target.recepient] })
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

    // socket.on("friendStatus", (data) => {
    //   if (data?.isOnline && data?.friendId) {
    //     dispatch(setOnline(data.friendId))
    //     queryClient.invalidateQueries({ queryKey: ['chatlist'] })
    //   } else {
    //     dispatch(setOffline(data.friendId))
    //     queryClient.invalidateQueries({ queryKey: ['chatlist'] })
    //   }
    // })


    socket.on("friendStatus", (data) => {
      console.log(data, 'friendstatus')
      if (data?.isOnline && data?.friendId) {
        queryClient.invalidateQueries({ queryKey: ['onlineStatus', data.friendId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['onlineStatus', data.friendId] })
      }
    })

    socket.on("notification", (data) => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      // dispatch(setNewNotification())
    })


    socket.on("unreadChatlist", (data) => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
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
            isMobile: data.isMobile
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
      dispatch(callRinging())
    })
    // socket.on("call-decline", (data) => {
    //   console.log("decline")
    //   toast.info("Call declined")
    //   dispatch(endCall())
    // })
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
            isMobile: data?.isMobile
          }
        ))
      }
    })
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("call-log", ({ message }) => {
      console.log(message, 'call log')
      queryClient.invalidateQueries({ queryKey: ["messages", message.sender] })

    })

    console.log('rerender socket')


    return () => {
      socket.off("connect");
      socket.off("disconnect");
      // socket.off("group-error");
      socket.off("chat");
      // socket.off("group-chat");
      // socket.off("toggleJoin");
      socket.off("upload-status");
      socket.off("chatlist");
      socket.off("friendStatus");
      socket.off("notification");
      socket.off("unreadChatlist");
      socket.off("request");
      socket.off("initiate-call");
      socket.off("call-ringing");
      socket.off("call-log");
      // socket.off("call-decline");
      socket.off("call-accept");
      // socket.off("friendOnlineStatusChange");
      // socket.off("users");
      // socket.off("getOnlineFriends");
      // socket.off('newMessage');
      console.log('exiting socket')
    };

  }, []);
  return socket
}