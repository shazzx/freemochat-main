import { acceptFriendRequest, fetchUser, fetchUserStories, followUserToggle, rejectFriendRequest, removeFriend, removeStory, sendFriendRequest, uploadStory, userFollowers, userFriendRequests, userFriends } from "@/api/User/users.api"
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

    return {
        data,
        isLoading,
        isError,
        isFetched,
        isSuccess,
    }
}


export const useUserStories = (userId: string) => {
    const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
        queryKey: ['stories', userId],
        queryFn: () => {
            return fetchUserStories()
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

export const useUploadStory = (userId: string) => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (formData: FormData) => {
            return uploadStory(formData)
        },


        onMutate: async () => {
            // await queryClient.cancelQueries({ queryKey: ['user', username] })
            // const previousUser = queryClient.getQueryData(['user', username])

            // queryClient.setQueryData(['user', username], (user: any) => {
            //     const updatedUser = produce(user, (draft: any) => {
            //         draft.friendRequest.isSentByUser = !draft.friendRequest.isSentByUser
            //         if (draft.friendRequest.isSentByUser) {
            //             toast.success('Friend request sent')
            //         }
            //         return draft

            //     })
            //     return updatedUser
            // });

            // return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ['stories', userId] })
        },
        onSettled: (e) => {
            console.log(e)

            queryClient.invalidateQueries({ queryKey: ['stories', userId] })
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

export const useRemoveStory = (userId: string) => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ storyId, url }: { storyId: string, url: string, openedStoryIndex: string, storyViewIndex: string }) => {
            return removeStory({ storyId, url })
        },


        onMutate: async ({ openedStoryIndex, storyViewIndex, storyId }) => {
            await queryClient.cancelQueries({ queryKey: ['stories', userId] })
            const previousUser = queryClient.getQueryData(['stories', userId])

            queryClient.setQueryData(['stories', userId], (stories: any) => {
                const updatedUser = produce(stories, (draft: any) => {
                    console.log(openedStoryIndex, storyViewIndex, stories)
                    if (draft[openedStoryIndex]?.stories[storyViewIndex]?._id == storyId) {
                        draft[openedStoryIndex]?.stories.splice(storyViewIndex, 1)
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
            queryClient.invalidateQueries({ queryKey: ['stories', userId] })

        },
        onSettled: (e) => {
            console.log(e)
            if (e) {
                queryClient.invalidateQueries({ queryKey: ['stories', userId] })
            }
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

// groupId can be of community group or chat group id. it's an optional id when provided an extra field will be returned with user object which is isGroupMember.
export function useUserFriends(userId?: string, groupId?: string): any {
    console.log(userId, groupId, 'fetchn friend')
    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['userFriends', userId],
        queryFn: ({ pageParam, }) => userFriends(pageParam, userId, groupId),
        // enabled: !!groupId,
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

        onMutate: async ({ recepientId }) => {
            await queryClient.cancelQueries({ queryKey: ['userRequests', user._id] })
            const previousRequests = queryClient.getQueryData(['userRequests', user._id])

            queryClient.setQueryData(['userRequests', user._id], (userRequests: any) => {
                const _userRequests = produce(userRequests, (draft: any) => {
                    draft.pages.forEach(((page, pageIndex) => (
                        page.friendRequests.forEach(({ sender }, requestIndex) => {
                            console.log(page)

                            if (sender._id == recepientId) {
                                console.log(userRequests.pages[pageIndex].friendRequests.splice(requestIndex, 1))
                                // draft.pages[pageIndex].friendRequests.splice(requestIndex, 1)
                                return
                            }
                        })

                    )))
                    return draft
                });
            })
            return { previousRequests };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['userRequests', user._id], context?.previousRequests)
        },
        onSettled: (data, err) => {
            console.log(data)
            toast.success("You're friends now")
            queryClient.invalidateQueries({ queryKey: ['userRequests', user._id] })
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


        onMutate: async ({ recepientId }) => {
            await queryClient.cancelQueries({ queryKey: ['user', username] })
            const previousUser = queryClient.getQueryData(['user', username])
            const previousFriends = queryClient.getQueryData(['userFriends', userId])

            queryClient.setQueryData(['user', username], (user: any) => {
                const updatedUser = produce(user, (draft: any) => {
                    if (user) {
                        draft.areFriends = false
                        draft.friendRequest = {
                            exists: false,
                            isRecievedByUser: false,
                            isSentByUser: false,
                        }
                        if (draft.friendsCount > 0) {
                            draft.friendsCount = draft.friendsCount - 1
                        }
                    }
                    return draft

                })
                return updatedUser
            });

            queryClient.setQueryData(['userFriends', userId], (friends: any) => {
                const updatedUser = produce(friends, (draft: any) => {
                    console.log(friends)
                    draft?.pages?.forEach(((page, pageIndex) => (
                        page.friends.forEach(({ friend }, friendIndex) => {
                            if (friend._id == recepientId) {
                                console.log(friends.pages[pageIndex].friends)
                                friends.pages[pageIndex].friends.splice(friendIndex, 1)
                                return
                            }
                        })
                    )))
                    return draft
                })
            });


            queryClient.setQueryData(['userFriends', recepientId], (friends: any) => {
                const updatedUser = produce(friends, (draft: any) => {
                    draft?.pages?.forEach(((page, pageIndex) => (
                        page.friends.forEach(({ friend }, friendIndex) => {
                            if (friend._id == recepientId) {
                                console.log(friends.pages[pageIndex].friends)
                                friends.pages[pageIndex].friends.splice(friendIndex, 1)
                                return
                            }
                        })
                    )))
                    return draft
                })
            });


            return { previousUser };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['user', username], context.previousUser)
        },
        onSettled: (data, err, { recepientId }) => {
            console.log(data)
            // queryClient.invalidateQueries({queryKey: ['userFriends', recepientId]})
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
        mutationFn: (userDetails: { recepientId: string, followers?: boolean }) => {
            return followUserToggle(userDetails.recepientId)
        },


        onMutate: async ({ recepientId, followers }) => {
            await queryClient.cancelQueries({ queryKey: ['user', username] })
            const previousUser = queryClient.getQueryData(['user', username])

            queryClient.setQueryData(['user', username], (user: any) => {
                const updatedUser = produce(user, (draft: any) => {
                    if (followers) {
                        return draft
                    }


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

            if (followers) {


                await queryClient.cancelQueries({ queryKey: ['userFollowers', userId] })
                const previousUser = queryClient.getQueryData(['userFollowers', userId])

                queryClient.setQueryData(['userFollowers', userId], (followers: any) => {
                    const updatedUser = produce(followers, (draft: any) => {
                        return draft.pages.forEach((page, p) => {
                            return page.followers.forEach(({ follower }, x) => {
                                if (follower._id == recepientId) {
                                    draft.pages[p].followers.splice(x, 1)
                                    return draft
                                }

                            })
                        })
                    })
                    return updatedUser
                });
            }


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
            // queryClient.invalidateQueries({ queryKey: ["userFollowers", userId] })
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

