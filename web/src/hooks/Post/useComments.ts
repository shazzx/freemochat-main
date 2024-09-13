import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchComments, CommentsResponse, createComment, likeComment, replyOnComment, fetchReplies, likeReply, updateComment, deleteComment, deleteReply, updateReply } from '../../api/Post/comments.api';
import { useAppSelector } from '@/app/hooks';
import { toast } from 'react-toastify';
import { produce } from 'immer'
import { CommentKeys } from '@/utils/enums/keys/main';

interface CreateComment {
  postId: string,
  commentDetails: {
    content: string,
    username: string
    duration?: string
  },
  uuid: string,
  audio?: { src: string, duration: string }
  formData: FormData
}

interface UpdateComment {
  commentId: string,
  pageIndex: number,
  commentIndex: number,
  commentDetails: {
    content: string,
  },
  formData: FormData

}


interface DeleteComment {
  postId: string,
  commentId: string,
  pageIndex: number,
  commentIndex: number,
  audio?: { src: string }
}

export function useComments(postId: string) {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery<CommentsResponse>({
    queryKey: [CommentKeys.COMMENTS],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
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


export function useReplies(commentId): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery<CommentsResponse>({
    queryKey: [CommentKeys.REPLIES],
    queryFn: ({ pageParam }) => fetchReplies(commentId, pageParam),
    staleTime: 0,
    enabled: !!commentId,
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

export const useCreateComment = ({ type, targetId, postId }: any) => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutateAsync } = useMutation({
    mutationFn: ({ formData }: CreateComment) => {
      return createComment(formData)
    },
    onMutate: async (newComment) => {

      await queryClient.cancelQueries({ queryKey: [type, targetId] })
      const previousPosts = queryClient.getQueryData([type, targetId])
      console.log(type, targetId, postId)
      if (!previousPosts) {

        await queryClient.cancelQueries({ queryKey: ['feed'] })
        const previousPosts = queryClient.getQueryData(['feed'])

        queryClient.setQueryData(['feed'], (pages: any) => {
          const updatedComments = produce(pages, (draft: any) => {
            return draft.pages.forEach((page, p) => {
              return (page.posts.forEach((post, x) => {
                if (post._id == postId) {
                  return draft.pages[p].posts[x].commentsCount = post.commentsCount + 1
                }
              }))
            })
          })
          return updatedComments
        })
      } else {
        queryClient.setQueryData([type, targetId], (pages: any) => {
          console.log(type, targetId)
          const updatedComments = produce(pages, (draft: any) => {
            return draft.pages.forEach((page, p) => {
              return (page.posts.forEach((post, x) => {
                if (post._id == postId) {
                  return draft.pages[p].posts[x].commentsCount = post.commentsCount + 1
                }
              }))
            })
          })
          return updatedComments
        });
      }


      await queryClient.cancelQueries({ queryKey: [CommentKeys.COMMENTS] })
      const previousComments = queryClient.getQueryData([CommentKeys.COMMENTS])

      queryClient.setQueryData([CommentKeys.COMMENTS], (pages: any) => {
        const firstPage = pages.pages[0]
        const updatedComments = produce(pages, (draft: any) => {
          console.log(newComment)
          if (newComment.audio) {
            draft.pages[0].comments.unshift(
              {
                content: newComment.commentDetails.content, audio: { ...newComment.audio, duration: newComment.commentDetails.duration }, post: newComment.postId, user: {
                  cover: user?.cover,
                  profile: user?.profile,
                  firstname: user.firstname,
                  lastname: user?.lastname,
                  username: user.username,
                  _id: user._id
                }
              }
            )
            return draft
          }

          draft.pages[0].comments.unshift({
            content: newComment.commentDetails.content, post: newComment.postId, user: {
              cover: user?.cover,
              profile: user?.profile,
              firstname: user.firstname,
              lastname: user?.lastname,
              username: user.username,
              _id: user._id
            }
          })

          return draft
        })
        return updatedComments
      })

      return { previousComments }
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.COMMENTS], context?.previousComments)
    },
    onSettled: async (data) => {

      await queryClient.cancelQueries({ queryKey: [CommentKeys.COMMENTS] })

      queryClient.setQueryData([CommentKeys.COMMENTS], (pages: any) => {
        const firstPage = pages.pages[0]
        const updatedComments = produce(pages, (draft: any) => {
          draft.pages[0].comments[0] = { ...data, ...draft.pages[0].comments[0] }
          return draft
        })
        return updatedComments
      })


      // queryClient.invalidateQueries({ queryKey: [CommentKeys.COMMENTS] })
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutateAsync
  }
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate } = useMutation({
    mutationFn: (commentDetails: UpdateComment) => {
      return updateComment(commentDetails.formData)
    },
    onMutate: async ({ commentDetails, pageIndex, commentId, commentIndex }) => {
      await queryClient.cancelQueries({ queryKey: [CommentKeys.COMMENTS] })
      const previousComments = queryClient.getQueryData([CommentKeys.COMMENTS])

      queryClient.setQueryData([CommentKeys.COMMENTS], (pages: any) => {
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].comments[commentIndex] && draft.pages[pageIndex].comments[commentIndex]._id == commentId) {
            draft.pages[pageIndex].comments[commentIndex].content = commentDetails.content
            return draft
          }

          throw new Error()
        })
        return updatedComments
      });
      return { previousComments }
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.COMMENTS], context.previousComments)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CommentKeys.COMMENTS] })
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutate
  }
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate } = useMutation({
    mutationFn: (commentDetails: DeleteComment) => {
      return deleteComment({ commentId: commentDetails.commentId, postId: commentDetails.postId, audio: commentDetails?.audio ?? null })
    },
    onMutate: async ({ commentId, pageIndex, commentIndex }) => {
      await queryClient.cancelQueries({ queryKey: [CommentKeys.COMMENTS] })
      const previousComments = queryClient.getQueryData([CommentKeys.COMMENTS])

      queryClient.setQueryData([CommentKeys.COMMENTS], (pages: any) => {
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].comments[commentIndex] && draft.pages[pageIndex].comments[commentIndex]._id == commentId) {
            draft.pages[pageIndex].comments.splice(commentIndex, 1)
            return draft
          }

          throw new Error()
        })
        return updatedComments
      });
      return { previousComments }
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.COMMENTS], context.previousComments)
    },
    onSettled: () => {
      // queryClient.invalidateQueries({ queryKey: [CommentKeys.COMMENTS] })
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutate
  }
}


export const useReplyOnComment = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutateAsync } = useMutation({
    mutationFn: (replyData: { postId: string, commentId: string, replyDetails: { content: string, duration?: string }, audio?: { src: string, duration: string }, formData: FormData }) => {
      return replyOnComment(replyData.formData)
    },
    onMutate: async ({ replyDetails, commentId, postId, audio }) => {
      console.log(replyDetails, commentId, postId)
      await queryClient.cancelQueries({ queryKey: [CommentKeys.REPLIES] })
      const previousReplies = queryClient.getQueryData([CommentKeys.REPLIES])

      queryClient.setQueryData([CommentKeys.REPLIES], (pages: any) => {
        const updatedReplies = produce(pages, (draft: any) => {
          console.log(pages)
          if (audio) {
            draft.pages[0].replies.unshift({
              content: replyDetails.content, post: postId, audio, user: {
                profile: user?.profile,
                cover: user?.cover,
                firstname: user?.firstname,
                lastname: user?.lastname,
                username: user?.username
              }
            })
            return draft
          }

          draft.pages[0].replies.unshift({
            content: replyDetails.content, post: postId, audio, user: {
              profile: user?.profile,
              cover: user?.cover,
              firstname: user?.firstname,
              lastname: user?.lastname,
              username: user?.username
            }
          })

          return draft
        })
        return updatedReplies
      })
      return { previousReplies }
    },

    onError: (err, newReply, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.REPLIES, newReply.commentId], context.previousReplies)
    },
    onSettled: (data, reply, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: [CommentKeys.REPLIES] })
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutateAsync
  }
}


export const useUpdateReply = () => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate } = useMutation({
    mutationFn: (replyDetails: { replyDetails, pageIndex: number, replyId: string, replyIndex: number, formData }) => {
      return updateReply(replyDetails.formData)
    },
    onMutate: async ({ replyDetails, pageIndex, replyId, replyIndex }) => {
      await queryClient.cancelQueries({ queryKey: [CommentKeys.REPLIES] })
      const previousReplies = queryClient.getQueryData([CommentKeys.REPLIES])

      queryClient.setQueryData([CommentKeys.REPLIES], (pages: any) => {
        const updatedReplies = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].replies[replyIndex] && draft.pages[pageIndex].replies[replyIndex]._id == replyId) {
            draft.pages[pageIndex].replies[replyIndex].content = replyDetails.content
            return draft
          }

          throw new Error()
        })
        return updatedReplies
      });
      return { previousReplies }
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.REPLIES], context.previousReplies)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CommentKeys.REPLIES] })
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutate
  }
}


export const useDeleteReply = () => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate } = useMutation({
    mutationFn: (replyDetails: { replyId: string, audio: { src: string, duration: string }, pageIndex: number, replyIndex: number }) => {
      return deleteReply({ replyId: replyDetails.replyId, audio: replyDetails?.audio ?? null })
    },
    onMutate: async ({ replyId, pageIndex, replyIndex }) => {
      await queryClient.cancelQueries({ queryKey: [CommentKeys.REPLIES] })
      const previousReplies = queryClient.getQueryData([CommentKeys.REPLIES])

      queryClient.setQueryData([CommentKeys.REPLIES], (pages: any) => {
        const updatedReplies = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].replies[replyIndex] && draft.pages[pageIndex].replies[replyIndex]._id == replyId) {
            draft.pages[pageIndex].replies.splice(replyIndex, 1)
            return draft
          }

          throw new Error()
        })
        return updatedReplies
      });
      return { previousReplies }
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.REPLIES], context.previousReplies)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CommentKeys.REPLIES] })
    }
  })

  return {
    data,
    isPending,
    isSuccess,
    mutate
  }
}


export const useLikeComment = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (commentDetails: { userId: string, commentId: string, pageIndex: number, commentIndex: number }) => {
      return likeComment({ targetId: commentDetails.commentId })
    },


    onMutate: async ({ commentId, commentIndex, pageIndex, userId }) => {
      await queryClient.cancelQueries({ queryKey: [CommentKeys.COMMENTS] })
      const previousComments = queryClient.getQueryData([CommentKeys.COMMENTS])

      queryClient.setQueryData([CommentKeys.COMMENTS], (pages: any) => {
        const updatedComments = produce(pages, (draft: any) => {

          if (draft.pages[pageIndex].comments[commentIndex] && draft.pages[pageIndex].comments[commentIndex]._id == commentId && draft.pages[pageIndex].comments[commentIndex].isLikedByUser) {
            draft.pages[pageIndex].comments[commentIndex].isLikedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].comments[commentIndex] && draft.pages[pageIndex].comments[commentIndex]._id == commentId && !draft.pages[pageIndex].comments[commentIndex].isLikedByUser) {
            draft.pages[pageIndex].comments[commentIndex].isLikedByUser = true
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
      queryClient.setQueryData([CommentKeys.COMMENTS], context.previousComments)
    },
    onSettled: (e) => {
      // uncommeting this will refetch the comments again from the server to be in sync
      // queryClient.invalidateQueries({ queryKey: [CommentKeys.COMMENTS] })
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


export const useLikeReply = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (replyDetails: { userId: string, commentId: string, replyId: string, pageIndex: number, replyIndex: number }) => {
      return likeReply({ targetId: replyDetails.replyId })
    },


    onMutate: async ({ replyId, replyIndex, commentId, pageIndex, userId }) => {
      await queryClient.cancelQueries({ queryKey: [CommentKeys.REPLIES] })
      const previousReplies = queryClient.getQueryData([CommentKeys.REPLIES])

      queryClient.setQueryData([CommentKeys.REPLIES], (pages: any) => {
        const updatedReplies = produce(pages, (draft: any) => {
          console.log(draft.pages[pageIndex].replies[replyIndex])

          if (draft.pages[pageIndex].replies[replyIndex] && draft.pages[pageIndex].replies[replyIndex]._id == replyId && draft.pages[pageIndex].replies[replyIndex].isLikedByUser) {
            draft.pages[pageIndex].replies[replyIndex].isLikedByUser = false
            return draft
          }

          if (draft.pages[pageIndex].replies[replyIndex] && draft.pages[pageIndex].replies[replyIndex]._id == replyId && !draft.pages[pageIndex].replies[replyIndex].isLikedByUser) {
            draft.pages[pageIndex].replies[replyIndex].isLikedByUser = true
            return draft
          }

          throw new Error()
        })
        return updatedReplies
      });

      return { previousReplies };
    },

    onError: (err, newReply, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData([CommentKeys.REPLIES], context.previousReplies)
    },
    onSettled: (e) => {
      queryClient.invalidateQueries({ queryKey: [CommentKeys.REPLIES] })
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
