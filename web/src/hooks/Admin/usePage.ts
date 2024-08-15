import { fetchPages, removePage } from "@/api/Admin/Page/page.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useMemo } from "react";
import { toast } from "react-toastify";

export function usePages(search): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['pagesAdmin'],
        queryFn: ({ pageParam, }) => fetchPages(pageParam, search.current),
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });

    let pages = useMemo(
        () => data?.pages.flatMap((page) => page.pages) ?? []
        ,
        [data]
    )


    return {
        data: pages ?? [],
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


export const useRemovePage = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ pageId }: { pageId: string }) => {
            return removePage(pageId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ['pagesAdmin'] })
        },
        onSettled: (data, err, context) => {

            queryClient.setQueryData(['pagesAdmin'], (pages: any) => {
                const updatedPages = produce(pages, (draft: any) => {
                    draft.pages.forEach((page, pageIndex) => {
                        page.users.forEach((page, pageIndex) => {
                            if (page._id == context.pageId) {
                                draft.pages[pageIndex].pages.splice(pageIndex, 1)
                            }
                        })
                    })
                    return draft
                })
                return updatedPages
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