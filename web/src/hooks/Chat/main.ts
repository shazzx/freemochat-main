import { createChatGroup, createMessage, fetchChatlist, fetchMessages,  fetchChatGroup, updateChatGroup, fetchChatGroups } from "@/api/Chat/chat.api"
import { toggleJoinGroup } from "@/api/Page/group.api"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { produce } from "immer"
import { toast } from "react-toastify"

export const useUserChatlist = () => {
    const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
        queryKey: ['chatlist'],
        queryFn: () => {
            return fetchChatlist()
        },

    })
    

    return {
        data,
        isLoading,
        isError,
        isFetched,
        isSuccess,
    }
}


export const useGroupMemberToggle = (_userId: string, groupId: string) => {
    
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (data: { userId: string, userIndex?: number, pageIndex?: number, type: string, toggleState?: string }) => {
            return toggleJoinGroup({groupDetails: {userId: data.userId, groupId, type: data.type}})
        },

        onMutate: async ({userId, userIndex, pageIndex, toggleState}) => {
            

            await queryClient.cancelQueries({ queryKey: [ 'chatgroup', groupId] })
            const previousGroup = queryClient.getQueryData([ 'chatgroup', groupId])
            queryClient.setQueryData([ 'chatgroup', groupId], (data: any) => {
                const updatedUser = produce(data, (draft: any) => {
                    console.log(data.membersCount)
                    if (toggleState == 'add') {
                        draft.membersCount = draft.membersCount + 1
                    }

                    if (toggleState == 'remove') {
                        draft.membersCount = draft.membersCount - 1
                    }
                })
                return updatedUser
            });


            await queryClient.cancelQueries({ queryKey: ['groupMembers', groupId] })
            const previousMembers = queryClient.getQueryData(['groupMembers', groupId])
            queryClient.setQueryData(['groupMembers', groupId], (data: any) => {
                const updatedUser = produce(data, (draft: any) => {
                    console.log(data.pages[pageIndex].members[userIndex], 'group Members')
                    if(draft.pages[pageIndex].members[userIndex] && toggleState == 'remove'){
                        draft.pages[pageIndex].members.splice(userIndex, 1)
                        return draft
                    }
                })
                return updatedUser
            });



            await queryClient.cancelQueries({ queryKey: ['userFriends', _userId] })
            const previousUser = queryClient.getQueryData(['userFriends', _userId])
            queryClient.setQueryData(['userFriends', _userId], (data: any) => {
                const updatedUser = produce(data, (draft: any) => {
                    
                    if (draft.pages[pageIndex].friends[userIndex].friend.isGroupMember) {
                        draft.pages[pageIndex].friends[userIndex].friend.isGroupMember = false 
                        toast.success('Member Removed')
                        return
                    }
                    
                    if (draft.pages[pageIndex].friends[userIndex].friend.isGroupMember == false) {
                        draft.pages[pageIndex].friends[userIndex].friend.isGroupMember = true
                        toast.success('Member Added')
                    }
                    return draft
                    
                })
                return updatedUser
            });

            return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err, newComment)
            toast.error("something went wrong")
            
        },
        onSettled: (e) => {
            console.log(e, 'member toggle response')
            
            
        }
    })

    return {
        data,
        isPending,
        isSuccess,
        mutateAsync,
        mutate
    }
}


export const useChatGroups = () => {
    const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
        queryKey: ['chatgroups'],
        queryFn: () => {
            return fetchChatGroups()
        },

    })
    

    return {
        data,
        isLoading,
        isError,
        isFetched,
        isSuccess,
    }
}

export const useChatGroup = (groupId: string) => {
    const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
        queryKey: ['chatgroup', groupId],
        queryFn: () => {
            return fetchChatGroup(groupId)
        },

    })

    return {
        data,
        isLoading,
        isError,
        isFetched,
        isSuccess,
    }
}

export const useCreateChatGroup = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (groupDetails: { groupDetails: { name: string, description: string }, images: { profile: string, cover: string }, formData: FormData }) => {
            return createChatGroup(groupDetails.formData)
        },

        
        
        
        

        
        
        

        
        
        
        

        
        

        onError: (err) => {
            console.log(err)
            toast.error("something went wrong")
            
        },
        onSettled: (e) => {
            console.log(e)
            
            queryClient.invalidateQueries({ queryKey: ["chatlist"] })
        }
    })

    return {
        data,
        isPending,
        isSuccess,
        mutateAsync,
        mutate
    }
}


export const useUpdateChatGroup = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (groupDetails: { updatedGroupDetails: { name: string, description: string }, images: { profile: string, cover: string }, formData: FormData }) => {
            return updateChatGroup(groupDetails.formData)
        },

        
        
        
        

        
        
        
        
        

        
        
        
        

        
        

        onError: (err) => {
            console.log(err)
            toast.error("something went wrong")
            
        },
        onSettled: (e) => {
            queryClient.invalidateQueries({ queryKey: ["chatgroup"] })
            console.log(e)
        }
    })

    return {
        data,
        isPending,
        isSuccess,
        mutateAsync,
        mutate
    }
}

export function useMessages({recepientId, isChatGroup}: {recepientId: string, isChatGroup: number}): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['messages', recepientId],
        queryFn: ({ pageParam, }) => fetchMessages(pageParam, recepientId, isChatGroup),
        refetchInterval: false,
        enabled: !!recepientId,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        getPreviousPageParam: (firstpage) => {
            return firstpage?.nextCursor
        },

    });
    

    return {
        data: data?.pages ?? [],
        isLoading,
        isSuccess,
        isFetching,
        fetchPreviousPage,
        isFetchingNextPage,
        fetchStatus,
        fetchNextPage,
        error,
    };
}


export const useCreateMessage = (recepientId: string) => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (messageDetails: { messageData: { recepient: string, content?: string, sender: string, type: string, media?: { url: string, type: string, duration?: string, isUploaded?: boolean } }, formData: FormData }) => {
            return createMessage(messageDetails.formData)
        },


        onMutate: async ({ messageData }) => {
            await queryClient.cancelQueries({ queryKey: ["messages", recepientId] })
            const previousPosts = queryClient.getQueryData(["messages", recepientId])
            console.log(messageData)

            queryClient.setQueryData(["messages", recepientId], (pages: any) => {
                const updatedPosts = produce(pages, (draft: any) => {
                    if (draft.pages[draft.pages.length - 1].messages) {
                        draft.pages[draft.pages.length - 1].messages = [...draft.pages[draft.pages.length - 1].messages, messageData]
                        return draft
                    }
                    throw new Error()
                })
                return updatedPosts
            });

            return { previousPosts };
        },

        onError: (err: any, newComment, context) => {
            queryClient.setQueryData(["messages", recepientId], context.previousPosts)
            if(err.response.status){
                toast.error('Format not supported')
                return
            }
            toast.error('something went wrong')
        },
        onSettled: (e) => {
            console.log(e)
            
            
        }
    })

    return {
        data,
        isPending,
        isSuccess,
        mutateAsync,
        mutate
    }
}