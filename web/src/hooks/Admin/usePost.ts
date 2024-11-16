import { fetchPosts, removePost } from "@/api/Admin/Post/post.api";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useMemo } from "react";
import { toast } from "react-toastify";

export function usePosts(search: any): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
        queryKey: ['usersPostsAdmin'],
        queryFn: ({ pageParam, }) => fetchPosts(pageParam, search.current),
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor

    });

    let posts = useMemo(
        () => data?.pages.flatMap((page) => page.posts) ?? []
        ,
        [data]
    )

    return {
        data: posts,
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

export const useRemovePost = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (postDetails: { postId: string, media: { url: string }[] }) => {
            return removePost(postDetails)
        },

        onError: (err, newData, context) => {
            console.log(err)
            toast.error(err.message)
            queryClient.invalidateQueries({ queryKey: ['usersPostsAdmin'] })
        },
        onSettled: (data, err, context) => {
            queryClient.setQueryData(['usersPostsAdmin'], (pages: any) => {
                const updatedUsers = produce(pages, (draft: any) => {
                    draft.pages.forEach((page, pageIndex) => {
                        page.posts.forEach((post, postIndex) => {
                            if (post._id == context.postId) {
                                draft.pages[pageIndex].posts.splice(postIndex, 1)
                            }
                        })
                    })
                    return draft
                })
                return updatedUsers
            });
            toast.success("Post Removed...")
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