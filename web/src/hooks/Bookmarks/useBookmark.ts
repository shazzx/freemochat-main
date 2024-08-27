import { fetchBookmarks } from "@/api/Bookmarks/bookmark.api";
import { bookmarkPost, likePost } from "@/api/Post/posts";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { toast } from "react-toastify";

export function useBookamrks(): any {

    const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error, refetch } = useInfiniteQuery({
        queryKey: ['userBookmarks'],
        queryFn: ({ pageParam, }) => fetchBookmarks(pageParam),
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
        refetch,
        fetchPreviousPage,
        isFetchingNextPage,
        fetchStatus,
        fetchNextPage,
        error,
    };
}


export const useLikeBookmarkedPost = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number }) => {
            return likePost({ postId: postDetails.postId })
        },


        onMutate: async ({ postId, postIndex, pageIndex, }) => {
            await queryClient.cancelQueries({ queryKey: ['userBookmarks'] })
            const previousComments = queryClient.getQueryData(['userBookmarks'])

            queryClient.setQueryData(['userBookmarks'], (pages: any) => {
                const updatedComments = produce(pages, (draft: any) => {

                    if (draft.pages[pageIndex].bookmarks[postIndex].post && draft.pages[pageIndex].bookmarks[postIndex].post._id == postId && draft.pages[pageIndex].bookmarks[postIndex].post.isLikedByUser) {
                        draft.pages[pageIndex].bookmarks[postIndex].post.isLikedByUser = false
                        draft.pages[pageIndex].bookmarks[postIndex].post.likesCount = draft.pages[pageIndex].bookmarks[postIndex].post.likesCount - 1

                        return draft
                    }

                    if (draft.pages[pageIndex].bookmarks[postIndex].post && draft.pages[pageIndex].bookmarks[postIndex].post._id == postId && !draft.pages[pageIndex].bookmarks[postIndex].post.isLikedByUser) {
                        draft.pages[pageIndex].bookmarks[postIndex].post.isLikedByUser = true
                        draft.pages[pageIndex].bookmarks[postIndex].post.likesCount = draft.pages[pageIndex].bookmarks[postIndex].post.likesCount + 1

                        return draft
                    }

                    throw new Error()
                })
                return updatedComments
            });

            return { previousComments };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['userBookmarks'], context.previousComments)
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

export const useBookmarkPost = () => {
    const queryClient = useQueryClient()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
            return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
        },


        onMutate: async ({ postId, postIndex, pageIndex, }) => {
            await queryClient.cancelQueries({ queryKey: ['userBookmarks'] })
            const previousComments = queryClient.getQueryData(['userBookmarks'])

            queryClient.setQueryData(['userBookmarks'], (pages: any) => {
                const updatedComments = produce(pages, (draft: any) => {

                    if (draft.pages[pageIndex].bookmarks[postIndex].post && draft.pages[pageIndex].bookmarks[postIndex].post._id == postId && draft.pages[pageIndex].bookmarks[postIndex].post.isBookmarkedByUser) {
                        draft.pages[pageIndex].bookmarks[postIndex].post.isBookmarkedByUser = false
                        return draft
                    }

                    if (draft.pages[pageIndex].bookmarks[postIndex].post && draft.pages[pageIndex].bookmarks[postIndex].post._id == postId && !draft.pages[pageIndex].bookmarks[postIndex].post.isBookmarkedByUser) {
                        draft.pages[pageIndex].bookmarks[postIndex].post.isBookmarkedByUser = true
                        return draft
                    }

                    throw new Error()
                })
                return updatedComments
            });

            return { previousComments };
        },

        onError: (err, newComment, context) => {
            console.log(err)
            toast.error("something went wrong")
            queryClient.setQueryData(['userBookmarks'], context.previousComments)
        },
        onSettled: (e) => {
            // uncommeting this will refetch the comments again from the server to be in sync
            // queryClient.invalidateQueries({ queryKey: ["feed"] })
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
