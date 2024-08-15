import { fetchChatGroups, removeChatGroup } from "@/api/Admin/ChatGroup/chatgroup.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import {  useMemo } from "react";
import { toast } from "react-toastify";

export function useChatGroups(search: any): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['chatGroupsAdmin'],
        queryFn: ({ pageParam, }) => fetchChatGroups(pageParam, search.current),
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor

    });
    let chatgroups = useMemo(
        () => data?.pages.flatMap((page) => page.chatgroups) ?? []
        ,
        [data]
    )

    return {
        data: chatgroups,
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

export const useRemoveChatGroup = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ groupId }: { groupId: string }) => {
            return removeChatGroup(groupId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ['chatGroupsAdmin'] })
        },
        onSettled: (data, err, context) => {

            queryClient.setQueryData(['chatGroupsAdmin'], (pages: any) => {
                const updatedUsers = produce(pages, (draft: any) => {
                    draft.pages.forEach((page, pageIndex) => {
                        page.users.forEach((post, groupIndex) => {
                            if (post._id == context.groupId) {
                                draft.pages[pageIndex].groups.splice(groupIndex, 1)
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