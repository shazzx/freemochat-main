import { campaignActivationToggle, fetchCampaignsData } from "@/api/Campaigns/main"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { produce } from "immer"
import { useMemo } from "react"
import { toast } from "react-toastify"

export const useCampaigns = (reverse) => {

    const { data, isSuccess, isLoading, fetchNextPage, refetch, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ["campaigns"],
        queryFn: ({ pageParam }) => {
            return fetchCampaignsData(pageParam, reverse)
        },
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor
    })

    // const flattenData = useMemo(() =>
    //     data?.pages.flatMap((page) => page.map((page) => page.promotions)[0]) ?? [],
    //     [data]
    // )

    // console.log(flattenData)

    return {
        data: data?.pages ?? [],
        isSuccess,
        isLoading,
        refetch,
        fetchNextPage,
        isFetchingNextPage,
    }
}

export const useCampaignsActivationToggle = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (campaignDetails: {postId: string, index: number}) => {
            return campaignActivationToggle(campaignDetails.postId)
        },


        onMutate: async ({postId, index}) => {
            await queryClient.cancelQueries({ queryKey: ['campaigns'] })
            const previousCampaigns = queryClient.getQueryData(['campaigns'])
            console.log(previousCampaigns)

            queryClient.setQueryData(['campaigns'], (pages: any) => {
                console.log(pages)
            });

            return { previousCampaigns };
        },

        onError: (err, newComment, context) => {
            toast.error("something went wrong")
            // queryClient.setQueryData(['campaigns'], context.previousComments)
        },
        onSettled: (e) => {
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