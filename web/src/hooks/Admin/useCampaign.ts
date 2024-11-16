import { fetchCampaigns, removeCampaign } from "@/api/Admin/campaign.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { toast } from "react-toastify";

export function useCampaigns(search): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['campaignsAdmin'],
        queryFn: ({ pageParam, }) => fetchCampaigns(pageParam, search.current),
        staleTime: 0,
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


export const useRemovePage = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: ({ campaignId }: { campaignId: string }) => {
            return removeCampaign(campaignId)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.invalidateQueries({ queryKey: ['campaignsAdmin'] })
        },
        onSettled: (data, err, context) => {

            queryClient.setQueryData(['campaignsAdmin'], (pages: any) => {
                const updatedPages = produce(pages, (draft: any) => {
                    draft.pages.forEach((page, pageIndex) => {
                        page.users.forEach((page, pageIndex) => {
                            if (page._id == context.campaignId) {
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