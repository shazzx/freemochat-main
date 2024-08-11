import { createPage, fetchPage, fetchPageFollowers, fetchPages, followPage, removePage, updatePage } from "@/api/Page/page.api"
import { fetchPosts } from "@/api/Post/posts"
import { useAppSelector } from "@/app/hooks"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { produce } from "immer"
import { toast } from "react-toastify"

export function usePage(handle: string): any {

  const { data, isLoading, isFetching, fetchStatus, isSuccess, error } = useQuery({
    queryKey: ['page'],
    queryFn: ({ pageParam, }) => fetchPage(handle),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  return {
    data: data ?? [],
    isLoading,
    isSuccess,
    isFetching,
    error,
  };
}

export function usePages(): any {

  const { data, isLoading, isFetching, fetchStatus, isSuccess, error } = useQuery({
    queryKey: ['pages'],
    queryFn: () => fetchPages(),
    refetchInterval: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });


  return {
    data: data ?? [],
    isLoading,
    isSuccess,
    isFetching,
    error,
  };
}


export const useCreatePage = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (pageDetails: { pageDetails: { name: string, username: string, about: string }, images: { profile: string, cover: string }, formData: FormData }) => {
      return createPage(pageDetails.formData)
    },

    onMutate: async ({ pageDetails, images }) => {
      await queryClient.cancelQueries({ queryKey: ['pages'] })
      const previousPages = queryClient.getQueryData(['pages'])

      queryClient.setQueryData(['pages'], (pages: any) => {
        const updatedPages = produce(pages, (draft: any) => {
          return [{ ...pageDetails, images, followers: 0, totalPosts: 0 }, ...pages]

          // throw new Error()
        })
        return updatedPages
      });

      return { previousPages };
    },

    onError: (err, newPage, context) => {
      console.log(err)
      toast.error("something went wrong")
      const previousPages = queryClient.getQueryData(['pages'])

      queryClient.setQueryData(['pages'], previousPages)
    },
    onSettled: (data) => {
      queryClient.setQueryData(['pages'], (pages: any) => {
        const updatedPages = produce(pages, (draft: any) => {
          pages.splice(0, 1)
          return [{...data}, ...pages]
        })
        return updatedPages
      });
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


export const useUpdatePage = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (pageDetails: { updatedPageDetails: { name: string, username: string, about: string }, images: { profile: string, cover: string }, formData: FormData, pageDetails }) => {
      return updatePage(pageDetails.formData)
    },

    onMutate: async ({ updatedPageDetails, images, pageDetails }) => {
      console.log(pageDetails, updatedPageDetails)
      await queryClient.cancelQueries({ queryKey: ['pages'] })
      const previousPages = queryClient.getQueryData(['pages'])

      queryClient.setQueryData(['pages'], (pages: any) => {
        const updatedPages = produce(pages, (draft: any) => {
          console.log(draft[pageDetails.index])
          draft[pageDetails.index] = { ...draft[pageDetails.index], images: { ...draft[pageDetails.index].images, ...images }, ...updatedPageDetails }
          console.log(draft[pageDetails.index])

          return draft
        })
        return updatedPages
      });

      return { previousPages };
    },

    onError: (err, newPage, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData(['pages'], context.previousPages)
    },
    onSettled: (data, err, context) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] })
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


export const useRemovePage = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (pageDetails: { pageId: string, pageIndex: number, images }) => {
      return removePage({ pageId: pageDetails.pageId, images: pageDetails.images })
    },

    onMutate: async ({ pageIndex, pageId }) => {
      await queryClient.cancelQueries({ queryKey: ['pages'] })
      const previousPages = queryClient.getQueryData(['pages'])

      queryClient.setQueryData(['pages'], (pages: any) => {
        const updatedPages = produce(pages, (draft: any) => {

          if (draft[pageIndex]?._id == pageId) {
            draft.splice(pageIndex, 1)
            return draft
          }

          console.log('not')


          // throw new Error()
        })
        return updatedPages
      });

      return { previousPages };
    },

    onError: (err, newPage, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData(['pages'], context.previousPages)
    },
    onSettled: (e) => {
      // this will refetch the pages again from the server to be in sync
      queryClient.invalidateQueries({ queryKey: ["pages"] })
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


export function usePageFollowers(pageId: string): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['pageFollowers'],
    queryFn: ({ pageParam, }) => fetchPageFollowers(pageParam, pageId),
    enabled: !!pageId,
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
    fetchPreviousPage,
    isFetchingNextPage,
    fetchStatus,
    fetchNextPage,
    error,
  };
}


export const useFollowPage = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (pageDetails: { pageId: string, authorId: string }) => {
      return followPage({ pageDetails })
    },


    onMutate: async ({ pageId }) => {
      await queryClient.cancelQueries({ queryKey: ['page'] })
      const previousPage = queryClient.getQueryData(['page'])

      queryClient.setQueryData(['page'], (page: any) => {
        const updatedPage = produce(page, (draft: any) => {
          if (draft.isFollower && draft.followersCount > 0) {
            draft.isFollower = false
            draft.followersCount = draft.followersCount - 1
            return draft
          }
          if (draft.isFollower == false) {
            draft.isFollower = true
            draft.followersCount = draft.followersCount + 1
            return draft
          }

          throw new Error()
        })
        return updatedPage
      });

      return { previousPage };
    },

    onError: (err, newComment, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData(['page'], context.previousPage)
    },
    onSettled: (e) => {
      // uncommeting this will refetch the comments again from the server to be in sync
      // queryClient.invalidateQueries({ queryKey: ["page"] })
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