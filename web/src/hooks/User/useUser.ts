import { joinGroup } from "@/api/Page/group.api"
import { acceptFriendRequest, fetchUser, followUserToggle, rejectFriendRequest, removeFriend, sendFriendRequest, userFollowers, userFriendRequests, userFriends } from "@/api/User/users.api"
import { useAppSelector } from "@/app/hooks"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { produce } from "immer"
import { toast } from "react-toastify"

export const useUser = (username, shouldFetch) => {
    const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
        queryKey: ['user', username],
        queryFn: () => {
            return fetchUser(username)
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

// export const useUserMedia = (username, shouldFetch) => {
//     const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
//         queryKey: ['user'],
//         queryFn: () => {
//             return fetchUser(username)
//         },

//     })
//     console.log(data)

//     return {
//         data,
//         isLoading,
//         isError,
//         isFetched,
//         isSuccess,
//     }
// }


// export const useFollowPage = () => {
//     const queryClient = useQueryClient()
//     const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
//         mutationFn: (pageDetails: { pageId: string }) => {
//             return followPage({ pageDetails })
//         },


//         onMutate: async ({ pageId }) => {
//             await queryClient.cancelQueries({ queryKey: ['page'] })
//             const previousPage = queryClient.getQueryData(['page'])

//             queryClient.setQueryData(['page'], (page: any) => {
//                 const updatedPage = produce(page, (draft: any) => {
//                     if (draft.isFollower) {
//                         draft.isFollower = false
//                         return draft
//                     }
//                     if (draft.isFollower == false) {
//                         draft.isFollower = true
//                         return draft
//                     }

//                     throw new Error()
//                 })
//                 return updatedPage
//             });

//             return { previousPage };
//         },

//         onError: (err, newComment, context) => {
//             console.log(err)
//             toast.error("something went wrong")
//             queryClient.setQueryData(['page'], context.previousPage)
//         },
//         onSettled: (e) => {
//             // uncommeting this will refetch the comments again from the server to be in sync
//             // queryClient.invalidateQueries({ queryKey: ["page"] })
//         }
//     })

//     return {
//         data,
//         isPending,
//         isSuccess,
//         mutateAsync,
//         mutate
//     }
// }


export function useUserFollowers(userId?: string): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['userFollowers', userId],
        queryFn: ({ pageParam, }) => userFollowers(pageParam, userId),
        refetchInterval: false,
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

// groupId can be of community group or chat group id. it's an optional id when provided an extra field will returned with user object which isGroupMember.
export function useUserFriends(userId?: string, groupId?: string): any {
console.log(userId, groupId, 'fetchn friend')
    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['userFriends', userId],
        queryFn: ({ pageParam, }) => userFriends(pageParam, userId, groupId),
        enabled: !!groupId,
        refetchInterval: false,
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

export function useUserRequests(): any {
    const { user } = useAppSelector((state) => state.user)
    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['userRequests', user._id],
        queryFn: ({ pageParam, }) => userFriendRequests(pageParam),
        refetchInterval: false,
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

export function useUserNotifications(): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: ({ pageParam, }) => userFriendRequests(pageParam),
        refetchInterval: false,
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


export const useFriendRequestToggle = (username) => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (userDetails: { recepientId: string }) => {
            return sendFriendRequest(userDetails.recepientId)
        },


        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['user', username] })
            const previousUser = queryClient.getQueryData(['user', username])

            queryClient.setQueryData(['user', username], (user: any) => {
                const updatedUser = produce(user, (draft: any) => {
                    draft.friendRequest.isSentByUser = !draft.friendRequest.isSentByUser
                    if (draft.friendRequest.isSentByUser) {
                        toast.success('Friend request sent')
                    }
                    return draft

                })
                return updatedUser
            });

            return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['user', username], context.previousUser)
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

export const useAcceptFriendRequest = () => {
    const { user } = useAppSelector(state => state.user)
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (userDetails: { recepientId: string, pageIndex?: number, requestIndex?: number, username: string }) => {
            return acceptFriendRequest(userDetails.recepientId)
        },

        onMutate: async ({ recepientId, pageIndex, requestIndex, username }) => {
            await queryClient.cancelQueries({ queryKey: ['user', username] })
            const previousUser = queryClient.getQueryData(['user', username])
            console.log(previousUser)

            queryClient.setQueryData(['user', username], (user: any) => {
                const updatedUser = produce(user, (draft: any) => {
                    if (draft?.friendRequest?.isRecievedByUser) {
                        draft.friendRequest.isRecievedByUser = false
                    }
                    console.log(user)

                    if (draft?.areFriends) {
                        draft.areFriends = true
                    }

                    if (draft?.friendsCount) {
                        draft.friendsCount = draft.friendsCount + 1
                    }
                    return draft
                })
                return updatedUser
            });

            if (pageIndex && requestIndex) {

                await queryClient.cancelQueries({ queryKey: ['userRequests', user._id] })
                const previousRequests = queryClient.getQueryData(['userRequests', user._id])
                queryClient.setQueryData(['userRequests', user._id], (pages) => {
                    const updatedRequests = produce(pages, (draft: any) => {
                        if (draft?.pages[pageIndex]?.friendRequests[requestIndex]) {
                            draft.pages[pageIndex].friendRequests.splice(requestIndex, 1)
                            toast.success("Request accepted")
                            return draft
                        }
                        // throw new Error()
                    })

                    return updatedRequests
                })

                return { previousUser, previousRequests };
            }
            return { previousUser };


        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['user', user.username], context.previousUser)
            queryClient.setQueryData(['userRequests', user._id], context?.previousRequests)
        },
        onSettled: (e) => {
            console.log(e)
            // uncommeting this will refetch the data again from the server to be in sync
            // queryClient.invalidateQueries({ queryKey: ['userRequests', user._id] })
            // queryClient.invalidateQueries({ queryKey: ['user'] })
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


export const useRejectFriendRequest = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (userDetails: { username: string }) => {
            return rejectFriendRequest(userDetails.username)
        },


        onMutate: async ({ username }) => {
            await queryClient.cancelQueries({ queryKey: ['user'] })
            const previousUser = queryClient.getQueryData(['user'])

            queryClient.setQueryData(['user'], (pages: any) => {
                const updatedUser = produce(pages, (draft: any) => {
                })
                return updatedUser
            });

            return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['user'], context.previousUser)
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


export const useRemoveFriend = (username: string, userId) => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (userDetails: { recepientId: string }) => {
            return removeFriend(userDetails.recepientId)
        },


        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['user', username] })
            const previousUser = queryClient.getQueryData(['user', username])
            const previousFriends = queryClient.getQueryData(['userFriends', userId])

            queryClient.setQueryData(['user', username], (user: any) => {
                const updatedUser = produce(user, (draft: any) => {
                    draft.areFriends = false
                    draft.friendRequest = {
                        exists: false,
                        isRecievedByUser: false,
                        isSentByUser: false,
                    }
                    if (draft.friendsCount > 0) {
                        draft.friendsCount = draft.friendsCount - 1
                    }
                    return draft

                })
                return updatedUser
            });

            queryClient.setQueryData(['userFriends', userId], (friends: any) => {
                const updatedUser = produce(friends, (draft: any) => {
                    console.log(friends)
                })
            });



            return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['user', username], context.previousUser)
        },
        onSettled: (e) => {
            console.log(e)
            // uncommeting this will refetch the comments again from the server to be in sync
            // queryClient.invalidateQueries({ queryKey: ["user", username] })
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

export const useFollowUserToggle = (username: string, userId: string) => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (userDetails: { recepientId: string }) => {
            return followUserToggle(userDetails.recepientId)
        },


        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['user', username] })
            const previousUser = queryClient.getQueryData(['user', username])

            queryClient.setQueryData(['user', username], (user: any) => {
                const updatedUser = produce(user, (draft: any) => {
                    if (draft.isFollowed && draft.followersCount > 0) {
                        draft.followersCount = draft.followersCount - 1
                    } else {
                        toast.success('Followed ' + username)
                        draft.followersCount = draft.followersCount + 1
                    }
                    draft.isFollowed = !draft.isFollowed
                    return draft
                })
                return updatedUser
            });

            return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['user', username], context.previousUser)
        },
        onSettled: (e) => {
            console.log(e)
            // uncommeting this will refetch the comments again from the server to be in sync
            queryClient.invalidateQueries({ queryKey: ["userFollowers", userId] })
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

