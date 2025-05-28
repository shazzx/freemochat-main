import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toast } from 'react-toastify';
import { produce } from 'immer'
import { bookmarkPost, createPost, createSharedPost, fetchFeed, fetchPost, fetchPostLikes, fetchPosts, likePost, promotePost, removePost, updatePost } from '@/api/Post/posts';
import { UrlObject } from 'url';
import { axiosClient } from '@/api/axiosClient';
import { redirectToCheckout } from '@/utils/redirectToCheckout';
import { createReel } from '@/api/Reel/reel.api';

export function useFeed(): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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

export function usePost(postId: string, type: string): any {

  const { data, isLoading, isFetching, isSuccess, error } = useQuery({
    queryKey: ['post'],
    queryFn: () => fetchPost(postId, type),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  return {
    data: data ?? {},
    isLoading,
    isSuccess,
    isFetching,
    error,
  };
}


export function useUserPosts(type: string, targetId: string, isSelf): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['userPosts', targetId],
    queryFn: ({ pageParam, }) => fetchPosts(pageParam, type, targetId, isSelf),
    enabled: !!targetId,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined
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


export const useCreatePost = (key: string, targetId?: string) => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postType?: string, content: string, selectedMedia: { file: File, type: string, url: UrlObject }[], formData: FormData, type: string, target: any, isUploaded?: boolean }) => {
      return createPost(postDetails.formData)
    },


    onMutate: async ({ content, selectedMedia, postType, type, target }) => {
      await queryClient.cancelQueries({ queryKey: [key, targetId] })
      const previousPosts = queryClient.getQueryData([key, targetId])
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      queryClient.setQueryData(['feed'], (pages: any) => {
        const updatedPosts = produce(pages, (draft: any) => {
          if (draft?.pages && draft?.pages[0].posts) {
            console.log(pages, 'feed')
            draft.pages[0].posts.unshift({ isBookmarkedByUser: false, isLikedByUser: false, content, createdAt: Date.now(), target: target, type, user: user._id, postType, media: selectedMedia, isUploaded: selectedMedia.length > 0 ? false : null })
            return draft
          }

          // if (!draft?.pages || !draft?.pages[0].posts) {
          //   draft =
          //   {
          //     pages: [{
          //       posts: [{ isBookmarkedByUser: false, isLikedByUser: false, content, createdAt: Date.now(), target: user, user: user._id, media: selectedMedia, isUploaded: selectedMedia.length > 0 ? false : null }],
          //       nextCursor: null,
          //     }, { pageParams: [null] }]
          //   }
          //   return draft
          // }
        })
        return updatedPosts
      });

      queryClient.setQueryData([key, targetId], (pages: any) => {
        const updatedPosts = produce(pages, (draft: any) => {
          if (draft?.pages && draft?.pages[0].posts) {

            draft.pages[0].posts.unshift({ isBookmarkedByUser: false, isLikedByUser: false, content, createdAt: Date.now(), target: target, type, postType, user: user._id, media: selectedMedia, isUploaded: selectedMedia.length > 0 ? false : null })
            return draft
          }

          // if (!draft?.pages || !draft?.pages[0].posts) {
          //   draft =
          //   {
          //     pages: [{
          //       posts: [{ isBookmarkedByUser: false, isLikedByUser: selectedMedia.length > 0 ? false : null, content, createdAt: Date.now(), target: user, user: user._id, media: selectedMedia, isUploaded: false }],
          //       nextCursor: null,
          //     }, { pageParams: [null] }]
          //   }
          //   return draft
          // }
        })
        return updatedPosts
      });
      return { previousPosts, previousFeed };
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error(err.message)
      queryClient.setQueryData([key, targetId], context.previousPosts)
    },
    onSettled: (data) => {
      if (data.isUploaded == null) {
        toast.success("Post created")
        queryClient.invalidateQueries({ queryKey: [key, targetId] })
        queryClient.invalidateQueries({ queryKey: ['feed'] })
      }
      // queryClient.setQueryData([key, targetId], (pages: any) => {
      //   const updatedPosts = produce(pages, (draft: any) => {

      //     if (draft?.pages && draft?.pages[0].posts) {
      //       draft.pages[0].posts.unshift(data)
      //       return draft
      //     }

      //     if (!draft?.pages || !draft?.pages[0].posts) {
      //       draft =
      //       {
      //         pages: [{
      //           posts: [{data}],
      //           nextCursor: null,
      //         }]
      //       }
      //       return draft
      //     }
      //   })
      //   return updatedPosts
      // });

      return
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

export const useCreateSharedPost = (key: string, targetId?: string) => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { sharedPostId: string, content: string, type: string, visibility: string, sharedPost: any, target: any, targetId?: string }) => {
      return createSharedPost({
        sharedPostId: postDetails?.sharedPostId,
        content: postDetails.content,
        type: postDetails.type,
        targetId: postDetails.targetId,
        visibility: postDetails.visibility,
      })
    },


    onMutate: async ({ content, sharedPost, type, target, targetId }) => {
      await queryClient.cancelQueries({ queryKey: [key, targetId] })
      const previousPosts = queryClient.getQueryData([key, targetId])
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousFeed = queryClient.getQueryData(['feed'])
      queryClient.setQueryData(['feed'], (pages: any) => {
        const updatedPosts = produce(pages, (draft: any) => {
          if (draft?.pages && draft?.pages[0].posts) {
            draft.pages[0].posts.unshift({ isBookmarkedByUser: false, isLikedByUser: false, content, createdAt: Date.now(), type, target: target, user: user._id, sharedPost, media: null, isUploaded: null })
            return draft
          }

          // if (!draft?.pages || !draft?.pages[0].posts) {
          //   draft =
          //   {
          //     pages: [{
          //       posts: [{ isBookmarkedByUser: false, isLikedByUser: false, content, createdAt: Date.now(), target: user, user: user._id, media: selectedMedia, isUploaded: selectedMedia.length > 0 ? false : null }],
          //       nextCursor: null,
          //     }, { pageParams: [null] }]
          //   }
          //   return draft
          // }
        })
        return updatedPosts
      });

      queryClient.setQueryData([key, targetId], (pages: any) => {
        const updatedPosts = produce(pages, (draft: any) => {
          if (draft?.pages && draft?.pages[0].posts) {
            // console.log(pages, 'user')

            draft.pages[0].posts.unshift({ isBookmarkedByUser: false, isLikedByUser: false, content, createdAt: Date.now(), type, target: target, user: user._id, sharedPost, media: null, isUploaded: null })
            return draft
          }

          // if (!draft?.pages || !draft?.pages[0].posts) {
          //   draft =
          //   {
          //     pages: [{
          //       posts: [{ isBookmarkedByUser: false, isLikedByUser: selectedMedia.length > 0 ? false : null, content, createdAt: Date.now(), target: user, user: user._id, media: selectedMedia, isUploaded: false }],
          //       nextCursor: null,
          //     }, { pageParams: [null] }]
          //   }
          //   return draft
          // }
        })
        return updatedPosts
      });
      return { previousPosts, previousFeed };
    },

    onError: (err, newComment, context) => {
      // console.log(err)
      // toast.error(err.message)
      queryClient.setQueryData([key, targetId], context.previousPosts)
    },
    onSettled: (data) => {
      if (data.isUploaded == null) {
        queryClient.invalidateQueries({ queryKey: [key, targetId] })
        if (key == 'groupPosts') {
          queryClient.invalidateQueries({ queryKey: ['groupFeed'] })
        }
        if (key == 'pagePosts') {
          queryClient.invalidateQueries({ queryKey: ['pageFeed'] })
        }
        queryClient.invalidateQueries({ queryKey: ['feed'] })
      }

      return
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

export function usePostLikes(postId): any {

  const { data, refetch, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['likes', postId],
    queryFn: ({ pageParam }) => fetchPostLikes(pageParam, postId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  return {
    data: data?.pages ?? [],
    isLoading,
    isSuccess,
    refetch,
    isFetching,
    fetchPreviousPage,
    isFetchingNextPage,
    fetchStatus,
    fetchNextPage,
    error,
  };
}


export const usePromotePost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, error, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: ({ postId, promotionDetails }: any) => {
      return promotePost(postId, promotionDetails)
    },

    onError: (err: any, data, context) => {
      const { response } = err
      if (!response) {
        toast.error(err.message)
        return false
      }
      const { data: { message } } = response
      toast.info(message)
    },
    onSettled: (data) => {
      if (data) {
        redirectToCheckout(data)
      }
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutateAsync,
    error,
    mutate
  }
}


export const useUpdatePost = (key, id: string) => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, postIndex: number, pageIndex: number, content: string, media: { type: string, url: string | UrlObject, file?: File, remove?: boolean }[], selectedMedia: { file: File, type: string, url: UrlObject }[], formData: FormData }) => {
      return updatePost(postDetails.formData)
    },


    onMutate: async ({ postId, postIndex, pageIndex, content, media, selectedMedia }) => {
      await queryClient.cancelQueries({ queryKey: [key, id] })
      const previousPosts = queryClient.getQueryData([key, id])

      queryClient.setQueryData([key, id], (pages: any) => {
        const updatedPosts = produce(pages, (draft: any) => {
          if (draft.pages[pageIndex] && draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId) {
            draft.pages[pageIndex].posts[postIndex].content = content
            let _media = media.map((media) => {
              if (!media.remove) {
                return media
              }
            })
            draft.pages[pageIndex].posts[postIndex].media = media

            return draft
          }

        })
        return updatedPosts
      });

      return { previousPosts };
    },

    onError: (err, newComment, context) => {
      console.log(err)
      if (err["response"].status == 400) {
        toast.info(err["response"].data.message)
        return
      }
      toast.error("something went wrong")
      queryClient.setQueryData([key, id], context.previousPosts)
    },
    onSettled: (data) => {
      if (data.isUploaded == null) {
        toast.success("Post updated")
      }
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


export const useRemovePost = (key, id) => {
  const { user } = useAppSelector(state => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, media: { type: string, url: string }[] }) => {
      return removePost({ postId: postDetails.postId, media: postDetails.media })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: [key, id] })
      const previousPosts = queryClient.getQueryData([key, id])

      queryClient.setQueryData([key, id], (pages: any) => {
        const updatedPosts = produce(pages, (draft: any) => {
          if (draft?.pages[pageIndex]?.posts[postIndex] && draft?.pages[pageIndex]?.posts[postIndex]?._id == postId) {
            draft?.pages[pageIndex].posts.splice(postIndex, 1)
            return draft
          }

          draft?.pages.forEach((page, pageIndex) => {
            return page
          })

          // throw new Error()
        })
        return updatedPosts
      });

      return { previousPosts };
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([key, id], context.previousPosts)
    },
    onSettled: (e) => {
      queryClient.invalidateQueries({ queryKey: ["userMedia", user._id] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })

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



export function usePagePosts(type: string, targetId: string): any {
  console.log(targetId)
  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['pagePosts', targetId],
    queryFn: ({ pageParam, }) => fetchPosts(pageParam, type, targetId),
    staleTime: 0,
    enabled: !!targetId,
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


export function useGroupPosts(type: string, targetId: string) {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['groupPosts', targetId],
    queryFn: ({ pageParam, }) => fetchPosts(pageParam, type, targetId),
    staleTime: 0,
    enabled: !!targetId,
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

export function useGroupsPosts(type: string): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['groupFeed'],
    queryFn: ({ pageParam, }) => fetchPosts(pageParam, type),
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

export function usePagesPosts(type: string): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['pageFeed'],
    queryFn: ({ pageParam, }) => fetchPosts(pageParam, type),
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

export const useLikePageFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string, type?: string, targetId?: string, reaction?: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, type: postDetails?.type, targetId: postDetails?.targetId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, postIndex, pageIndex, reaction }) => {
      await queryClient.cancelQueries({ queryKey: ['pageFeed'] })
      const previousComments = queryClient.getQueryData(['pageFeed'])

      queryClient.setQueryData(['pageFeed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount - 1
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction: null }

            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount + 1
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction }


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
      queryClient.setQueryData(['pageFeed'], context.previousComments)
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


export const useLikeSinglePost = (postId: string) => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, authorId: string, type?: string, targetId?: string, reaction: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, type: postDetails?.type, targetId: postDetails?.targetId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: ['post'] })

      queryClient.setQueryData(['post'], (pages: any) => {
        const updatedPost = produce(pages, (draft: any) => {
          if (draft[0] && draft[0]._id == postId && draft[0].isLikedByUser) {
            draft[0].isLikedByUser = false
            draft[0].likesCount = draft[0].likesCount - 1
            draft[0] = { ...draft[0], reaction: null }
            return draft
          }

          if (draft[0] && draft[0]._id == postId && !draft[0].isLikedByUser) {
            draft[0].isLikedByUser = true
            draft[0].likesCount = draft[0].likesCount + 1
            draft[0] = { ...draft[0], reaction }
            return draft
          }

          throw new Error()
        })
        return updatedPost
      });
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
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


export const useBookmarkSinglePost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['post'] })

      queryClient.setQueryData(['post'], (pages: any) => {
        const updatedPost = produce(pages, (draft: any) => {
          if (draft[0] && draft[0]._id == postId && draft[0].isBookmarkedByUser) {
            draft[0].isBookmarkedByUser = false
            draft[0].bookmarksCount = draft[0].bookmarksCount - 1
            return draft
          }

          if (draft[0] && draft[0]._id == postId && !draft[0].isBookmarkedByUser) {
            draft[0].isBookmarkedByUser = true
            draft[0].bookmarksCount = draft[0].bookmarksCount + 1
            return draft
          }

          throw new Error()
        })
        return updatedPost
      });
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
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


export function useSearch(type: any, query: any, key: any): any {
  console.log(type.current, " : type", " : query", query, " : key", key)

  const { data, isLoading, refetch, isFetching, fetchStatus, isSuccess, error } = useQuery({
    queryKey: ["search", query.current],
    queryFn: () => axiosClient.get(`/search?query=${query?.current}&&type=${type?.current}`),
    enabled: !!type.current && !!query.current,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  return {
    data: data?.data ?? [],
    isLoading,
    isSuccess,
    isFetching,
    refetch,
    fetchStatus,
    error,
  };
}


export const useLikeSearchFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string, reaction }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, postIndex, pageIndex, reaction }) => {
      await queryClient.cancelQueries({ queryKey: ['pageFeed'] })
      const previousComments = queryClient.getQueryData(['pageFeed'])

      queryClient.setQueryData(['pageFeed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount - 1
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction: null }

            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction }
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount + 1

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
      queryClient.setQueryData(['pageFeed'], context.previousComments)
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

export const useBookmarkSearchFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['pageFeed'] })
      const previousComments = queryClient.getQueryData(['pageFeed'])

      queryClient.setQueryData(['pageFeed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            draft.pages[pageIndex].posts[postIndex].bookmarksCount = draft.pages[pageIndex].posts[postIndex].bookmarksCount - 1

            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
            draft.pages[pageIndex].posts[postIndex].bookmarksCount = draft.pages[pageIndex].posts[postIndex].bookmarksCount + 1

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
      queryClient.setQueryData(['pageFeed'], context.previousComments)
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

export const useBookmarkPageFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['pageFeed'] })
      const previousComments = queryClient.getQueryData(['pageFeed'])

      queryClient.setQueryData(['pageFeed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            draft.pages[pageIndex].posts[postIndex].bookmarksCount = draft.pages[pageIndex].posts[postIndex].bookmarksCount - 1

            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
            draft.pages[pageIndex].posts[postIndex].bookmarksCount = draft.pages[pageIndex].posts[postIndex].bookmarksCount + 1

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
      queryClient.setQueryData(['pageFeed'], context.previousComments)
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


export const useLikeGroupFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string, reaction: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, postIndex, pageIndex, reaction }) => {
      await queryClient.cancelQueries({ queryKey: ['groupFeed'] })
      const previousComments = queryClient.getQueryData(['groupFeed'])

      queryClient.setQueryData(['groupFeed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount - 1
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction }
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount + 1

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
      queryClient.setQueryData(['groupFeed'], context.previousComments)
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

export const useBookmarkGroupFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['groupFeed'] })
      const previousComments = queryClient.getQueryData(['groupFeed'])

      queryClient.setQueryData(['groupFeed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
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
      queryClient.setQueryData(['groupFeed'], context.previousComments)
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


export const useLikeSearchPost = (query: string) => {
  console.log(query)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string, reaction: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, postIndex, pageIndex, reaction }) => {
      console.log(postId, postIndex, pageIndex, reaction, 'uselikesearch')
      await queryClient.cancelQueries({ queryKey: ["search", query] })
      const previousComments = queryClient.getQueryData(["search", query])

      queryClient.setQueryData(["search", query], (pages: any) => {
        console.log(pages?.data?.posts)
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.data.posts[postIndex] && draft.data.posts[postIndex]._id == postId && draft.data.posts[postIndex].isLikedByUser) {
            draft.data.posts[postIndex].isLikedByUser = false
            draft.data.posts[postIndex] = { ...draft.data.posts[postIndex], reaction: null }
            draft.data.posts[postIndex].likesCount = draft.data.posts[postIndex].likesCount - 1

            return draft
          }

          if (draft.data.posts[postIndex] && draft.data.posts[postIndex]._id == postId && !draft.data.posts[postIndex].isLikedByUser) {
            draft.data.posts[postIndex].isLikedByUser = true
            draft.data.posts[postIndex] = { ...draft.data.posts[postIndex], reaction }
            draft.data.posts[postIndex].likesCount = draft.data.posts[postIndex].likesCount + 1

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
      queryClient.setQueryData(['userPosts'], context.previousComments)
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


export const useBookmarkSearchPost = (query: string) => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex }) => {
      await queryClient.cancelQueries({ queryKey: ["search", query] })
      const previousComments = queryClient.getQueryData(["search", query])

      queryClient.setQueryData(["search", query], (data: any) => {
        console.log(data.data.posts[postIndex])
        const updatedComments = produce(data, (draft: any) => {

          if (draft.data.posts[postIndex] && draft.data.posts[postIndex]._id == postId && draft.data.posts[postIndex].isBookmarkedByUser) {
            draft.data.posts[postIndex].isBookmarkedByUser = false
            return draft
          }

          if (draft.data.posts[postIndex] && draft.data.posts[postIndex]._id == postId && !draft.data.posts[postIndex].isBookmarkedByUser) {
            draft.data.posts[postIndex].isBookmarkedByUser = true
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
      // queryClient.setQueryData([type, targetId], context.previousComments)
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

// uselikepost

export const useLikePost = (type: string, targetId: string) => {
  console.log(type, targetId)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string, type?: string, targetId: string, reaction?: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, type: postDetails?.type, targetId: postDetails.targetId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, postIndex, pageIndex, reaction }) => {
      await queryClient.cancelQueries({ queryKey: [type, targetId] })
      const previousComments = queryClient.getQueryData([type, targetId])

      queryClient.setQueryData([type, targetId], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount - 1
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction: null }

            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction }

            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount + 1

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
      queryClient.setQueryData(['userPosts'], context.previousComments)
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

export const useBookmarkPost = (type: string, targetId: string) => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: [type, targetId] })
      const previousComments = queryClient.getQueryData([type, targetId])

      queryClient.setQueryData([type, targetId], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
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
      queryClient.setQueryData([type, targetId], context.previousComments)
    },
    onSettled: (e) => {
      // uncommeting this will refetch the data again from the server to be in sync
      // queryClient.invalidateQueries({ queryKey: ["type", targetId] })
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

export const useLikePagePost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['pagePosts'] })
      const previousComments = queryClient.getQueryData(['pagePosts'])

      queryClient.setQueryData(['pagePosts'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true
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
      queryClient.setQueryData(['pagePosts'], context.previousComments)
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

export const useLikeGroupPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['groupPosts'] })
      const previousComments = queryClient.getQueryData(['groupPosts'])

      queryClient.setQueryData(['groupPosts'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true
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
      queryClient.setQueryData(['groupPosts'], context.previousComments)
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


export const useBookmarkPagePost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['pagePosts'] })
      const previousComments = queryClient.getQueryData(['pagePosts'])

      queryClient.setQueryData(['pagePosts'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
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
      queryClient.setQueryData(['pagePosts'], context.previousComments)
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


export const useBookmarkGroupPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['groupPosts'] })
      const previousComments = queryClient.getQueryData(['groupPosts'])

      queryClient.setQueryData(['groupPosts'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
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
      queryClient.setQueryData(['groupPosts'], context.previousComments)
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


export const useLikeFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, authorId: string, type?: string, targetId: string, reaction?: string }) => {
      return likePost({ postId: postDetails.postId, authorId: postDetails.authorId, type: postDetails?.type, targetId: postDetails.targetId, reaction: postDetails?.reaction })
    },


    onMutate: async ({ postId, postIndex, pageIndex, reaction }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousComments = queryClient.getQueryData(['feed'])

      queryClient.setQueryData(['feed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = false
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount - 1
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction: null }
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isLikedByUser) {
            draft.pages[pageIndex].posts[postIndex].likesCount = draft.pages[pageIndex].posts[postIndex].likesCount + 1
            draft.pages[pageIndex].posts[postIndex] = { ...draft.pages[pageIndex].posts[postIndex], reaction }
            draft.pages[pageIndex].posts[postIndex].isLikedByUser = true

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
      queryClient.setQueryData(['feed'], context.previousComments)
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

export const useBookmarkFeedPost = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (postDetails: { postId: string, pageIndex: number, postIndex: number, targetId: string, type: string }) => {
      return bookmarkPost({ postId: postDetails.postId, targetId: postDetails.targetId, type: postDetails.type })
    },


    onMutate: async ({ postId, postIndex, pageIndex, }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      const previousComments = queryClient.getQueryData(['feed'])

      queryClient.setQueryData(['feed'], (pages: any) => {
        console.log(pages.pages[pageIndex].posts[postIndex])
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].posts[postIndex] && draft.pages[pageIndex].posts[postIndex]._id == postId && !draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser) {
            draft.pages[pageIndex].posts[postIndex].isBookmarkedByUser = true
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
      queryClient.setQueryData(['feed'], context.previousComments)
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
