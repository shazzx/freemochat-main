import {  removePage } from "@/api/Admin/Page/page.api";
import { fetchReports } from "@/api/Admin/report.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { toast } from "react-toastify";

export function useReports(search): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['reportsAdmin'],
        queryFn: ({ pageParam, }) => fetchReports(pageParam, search.current),
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });
    console.log(error)

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


export const useRemoveReport = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ reportId }: { reportId: string }) => {
            return removePage(reportId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ['reportsAdmin'] })
        },
        onSettled: (data, err, context) => {

            queryClient.setQueryData(['reportsAdmin'], (pages: any) => {
                const updatedPages = produce(pages, (draft: any) => {
                    draft.pages.forEach((page, pageIndex) => {
                        page.users.forEach((report, reportIndex) => {
                            if (report._id == context.reportId) {
                                draft.pages[pageIndex].reports.splice(reportIndex, 1)
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