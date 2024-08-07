import { fetchUsers, removeUser, suspendUser } from "@/api/Admin/User/users.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export function useUsers(search: any): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['usersAdmin'],
        queryFn: ({ pageParam, }) => fetchUsers(pageParam, search.current),
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor

    });

    let users = useMemo(
        () => data?.pages.flatMap((page) => page.users) ?? []
        ,
        [data]
    )

    return {
        data: users || [...users, ...users, ...users, ...users, ...users, ...users, ...users],
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



export const useSuspendUser = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ userId }: { userId: string }) => {
            return suspendUser(userId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ["usersAdmin"] })
        },
        onSettled: async (data, err, context) => {
            toast.success(data?.message)
            await queryClient.cancelQueries({ queryKey: ['usersAdmin'] })

            queryClient.setQueryData(['usersAdmin'], (pages: any) => {
                const updatedUsers = produce(pages, (draft: any) => {
                    draft.pages.forEach((page) => {
                        page.users.forEach((user) => {
                            if (user._id == context.userId) {
                                user.isSuspended = !user.isSuspended
                            }
                        })
                    })
                    return draft
                })
                return updatedUsers
            });
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


export const useRemoveUser = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ userId }: { userId: string }) => {
            return removeUser(userId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ["usersAdmin"] })
        },
        onSettled: (data, err, context) => {
            toast.success("user removed")
            queryClient.setQueryData(['usersAdmin'], (pages: any) => {
                const updatedUsers = produce(pages, (draft: any) => {
                    draft.pages.forEach((page, pageIndex) => {
                        page.users.forEach((user, userIndex) => {
                            if (user._id == context.userId) {
                                draft.pages[pageIndex].users.splice(userIndex, 1)
                            }
                        })
                    })
                    return draft
                })
                return updatedUsers
            });
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