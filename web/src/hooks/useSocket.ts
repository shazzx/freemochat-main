import { useAppSelector } from "@/app/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

export const useSocket = (recepient) => {
    const queryClient = useQueryClient();
    const { socket } = useAppSelector((data) => data.socket) as { socket: Socket }
    const socketRef = useRef(socket);

    console.log('recepeet', recepient)

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

        return () => {
            socket.off('newMessage');
        };
    }, [queryClient]);

    return socketRef.current;
}