import { createChatGroup, createMessage, fetchChatlist, fetchMessages,  fetchChatGroup, updateChatGroup } from "@/api/Chat/chat.api"
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
    console.log(data)

    return {
        data,
        isLoading,
        isError,
        isFetched,
        isSuccess,
    }
}


export const useGroupMemberToggle = (_userId: string, groupId: string) => {
    console.log(groupId, 'groupid')
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (data: { userId: string, userIndex?: number, pageIndex?: number, type: string }) => {
            return toggleJoinGroup({groupDetails: {userId: data.userId, groupId, type: data.type}})
        },

        // onMutate: async ({userId, userIndex, pageIndex}) => {
        //     console.log(userId)
        //     await queryClient.cancelQueries({ queryKey: ['userFriends', _userId] })
        //     const previousUser = queryClient.getQueryData(['userFriends', _userId])

        //     queryClient.setQueryData(['userFriends', _userId], (data: any) => {
        //         const updatedUser = produce(data, (draft: any) => {
        //             console.log(data)
        //             if (draft.pages[pageIndex].friends[userIndex].isGroupMember) {
        //                 draft.pages[pageIndex].friends[userIndex].isGroupMember = false 
        //                 toast.success('Member Removed')
        //             }
                    
        //             if (draft.pages[pageIndex].friends[userIndex].isGroupMember == false) {
        //                 draft.pages[pageIndex].friends[userIndex].isGroupMember = true
        //                 toast.success('Member Added')
        //             }
        //             return draft
                    
        //         })
        //         return updatedUser
        //     });

        //     return { previousUser };
        // },

        onError: (err, newComment, context) => {
            console.log(err, newComment)
            toast.error("something went wrong")
            // queryClient.setQueryData(['userFriends', _userId], context.previousUser)
        },
        onSettled: (e) => {
            console.log(e)
            // uncommeting this will refetch the comments again from the server to be in sync
            // queryClient.invalidateQueries({ queryKey: ["comments"] })
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
            return fetchChatlist()
        },

    })
    console.log(data)

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
        queryKey: ['chatgroup'],
        queryFn: () => {
            return fetchChatGroup(groupId)
        },

    })
    console.log(data)

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
        mutationFn: (groupDetails: { groupDetails: { name: string, username: string, about: string }, images: { profile: string, cover: string }, formData: FormData }) => {
            return createChatGroup(groupDetails.formData)
        },

        // onMutate: async ({ groupDetails, images }) => {
        //     console.log(groupDetails, images)
        //     await queryClient.cancelQueries({ queryKey: ["chatgroups"] })
        //     const previousGroups = queryClient.getQueryData(["chatgroups"])

        //     queryClient.setQueryData(["chatgroups"], (pages: any) => {
        //         const updatedGroups = produce(pages, (draft: any) => {
        //             return [{ ...groupDetails, images, followers: 0, totalPosts: 0 }, ...pages]

        //             // throw new Error()
        //         })
        //         return updatedGroups
        //     });

        //     return { previousGroups };
        // },

        onError: (err) => {
            console.log(err)
            toast.error("something went wrong")
            // queryClient.setQueryData(["chatgroups"], context.previousGroups)
        },
        onSettled: (e) => {
            console.log(e)
            // uncommeting this will refetch the comments again from the server to be in sync
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
        mutationFn: (groupDetails: { updatedGroupDetails: { name: string, username: string, about: string }, images: { profile: string, cover: string }, formData: FormData }) => {
            return updateChatGroup(groupDetails.formData)
        },

        // onMutate: async ({ updatedGroupDetails, images, groupDetails }) => {
        //     console.log(groupDetails, updatedGroupDetails)
        //     await queryClient.cancelQueries({ queryKey: ['groups'] })
        //     const previousGroups = queryClient.getQueryData(['groups'])

        //     queryClient.setQueryData(['groups'], (groups: any) => {
        //         const updatedGroups = produce(groups, (draft: any) => {
        //             console.log(draft[groupDetails.index])
        //             draft[groupDetails.index] = { ...draft[groupDetails.index], images: { ...draft[groupDetails.index].images, ...images }, ...updatedGroupDetails }
        //             console.log(draft[groupDetails.index])

        //             return draft
        //         })
        //         return updatedGroups
        //     });

        //     return { previousGroups };
        // },

        onError: (err) => {
            console.log(err)
            toast.error("something went wrong")
            // queryClient.setQueryData(['groups'], context.previousGroups)
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
console.log(recepientId, isChatGroup, 'recepient id')
    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['messages', recepientId],
        queryFn: ({ pageParam, }) => fetchMessages(pageParam, recepientId, isChatGroup),
        refetchInterval: false,
        enabled: !!recepientId,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor
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
        mutationFn: (messageDetails: { messageData: { recepient: string, content?: string, sender: string, type: string, media?: { url: string, type: string, duration?: string } }, formData: FormData }) => {
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

        onError: (err, newComment, context) => {
            console.log(err, newComment)
            toast.error("something went wrong")
            queryClient.setQueryData(["messages", recepientId], context.previousPosts)
        },
        onSettled: (e) => {
            console.log(e)
            // uncommeting this will refetch the user posts again from the server to be in sync
            // queryClient.invalidateQueries({ queryKey: ["userPosts"] })
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