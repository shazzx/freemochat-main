import { useAppSelector } from "@/app/hooks";
import { socketConnect } from "@/websocket/socket.io";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

export const useSocket = (recepient? :string) => {
    const queryClient = useQueryClient();
    const {user} = useAppSelector(state => state.user)
    const socket = socketConnect(user && user.username)
    const socketRef = useRef(socket);

    useEffect(() => {
        const socket = socketRef.current;

        socket.on('chat', (message) => {
            let newMessage = {
                recepient: message?.recepientDetails?.userId,
                sender: message?.senderDetails?.userId,
                content: message?.body,
                type: message?.type
            }
            queryClient.setQueryData(["messages", recepient], (pages: any) => {
                const updatedMessages = produce(pages, (draft: any) => {
                    console.log(pages)
                    if(!draft){
                        console.log('no draft ')
                        return null
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

        socket.on("disconnect", () => { // fire when socked is disconnected
            console.log("Socket disconnected");
          });
      
          socket.on("notification", (data) => {
            console.log(data)
          })
      
          socket.on("users", (users) => {
            console.log(users)
          })
      
          socket.on("getOnlineFriends", (onlineFriends) => {
            console.log(onlineFriends)
          })
      
          socket.on("friendOnlineStatusChange", (statusChange) => {
            console.log(statusChange)
          })
          
      
          socket.on("friendStatus", (data) => {
            console.log(data, 'friend status')
          })
      
          socket.on("upload-status", (data) => {
            if(data.isSuccess && data.target.type == "page"){
              // const {targetId} = data.target
              queryClient.invalidateQueries({ queryKey: ['page'] })
              queryClient.invalidateQueries({ queryKey: ['pages'] })
            }
            if(data.isSuccess){
              console.log('upload-success')
            }else{
              toast.error("something went wrong try agan later")
            }
              queryClient.invalidateQueries({ queryKey: ['userPosts', user._id] })
              queryClient.invalidateQueries({ queryKey: ['userMedia', user._id] })
      
          })
      
          socket.on("chatlist", (chatlists) => {
            queryClient.invalidateQueries({ queryKey: ['chatlist'] })
            // console.log(chatlists)
          })
      
          // remove all event listeners
          return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("chat");
            socket.off("chatlist");
            socket.off("upload-status");
            socket.off("friendOnlineStatusChange");
            socket.off("friendStatus");
            socket.off("users");
            socket.off("getOnlineFriends");
            socket.off("notification");
            socket.off('newMessage');
          };
    }, [queryClient]);

    return socketRef.current;
}