import { fetchGroups, removeGroup } from "@/api/Admin/Group/group.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useMemo } from "react";
import { toast } from "react-toastify";

export function useGroups(search: any): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['groupsAdmin'],
        queryFn: ({ pageParam, }) => fetchGroups(pageParam, search?.current),
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });

    let groups = useMemo(
        () => data?.pages.flatMap((page) => page.groups) ?? []
        ,
        [data]
    )

    return {
        data: groups,
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

export const useRemoveGroup = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ groupId }: { groupId: string }) => {
            return removeGroup(groupId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ['groupsAdmin'] })
        },
        onSettled: (data, err, context) => {

            queryClient.setQueryData(['groupsAdmin'], (pages: any) => {
                const updatedUsers = produce(pages, (draft: any) => {
                    
                    draft.pages.forEach((page, pageIndex) => {
                        page.groups.forEach((post, groupIndex) => {
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