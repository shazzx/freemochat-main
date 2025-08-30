import { createGroup, fetchGroup, fetchGroupMembers, fetchGroups, joinGroup, removeGroup, toggleGroupAdmin, toggleJoinGroup, updateGroup } from "@/api/Page/group.api";
import { useAppSelector } from "@/app/hooks";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { group } from "console";
import { produce } from "immer";
import { toast } from "react-toastify";

export function useGroup(handle: string): any {

  const { data, isLoading, isFetching, isSuccess, error, isError } = useQuery({
    queryKey: ['group'],
    queryFn: () => fetchGroup(handle),

  });

  return {
    data: data ?? [],
    isLoading,
    isSuccess,
    isError,
    isFetching,
    error,
  };
}

export function useGroups(): any {
  const { data, isLoading, isFetching, isSuccess, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups(),
  });

  return {
    data: data ?? [],
    isLoading,
    isSuccess,
    isFetching,
    error,
  };
}


export const useCreateGroup = () => {

  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (groupDetails: { groupDetails: { name: string, username: string, about: string }, images: { profile: string, cover: string }, formData: FormData }) => {
      return createGroup(groupDetails.formData)
    },

    onMutate: async ({ groupDetails, images }) => {
      console.log(groupDetails, images)
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      const previousGroups = queryClient.getQueryData(['groups'])

      
      
      

      
      
      
      

      return { previousGroups };
    },

    onError: (err, newGroup, context) => {
      console.log(err)
      toast.error("something went wrong")
      
    },
    onSettled: (e) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })

      
      
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


export const useUpdateGroup = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (groupDetails: { updatedGroupDetails: { name: string, username: string, about: string }, images: { profile: string, cover: string }, formData: FormData, groupDetails }) => {
      return updateGroup(groupDetails.formData)
    },

    onMutate: async ({ updatedGroupDetails, images, groupDetails }) => {
      console.log(groupDetails, updatedGroupDetails)
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      const previousGroups = queryClient.getQueryData(['groups'])

      queryClient.setQueryData(['groups'], (groups: any) => {
        const updatedGroups = produce(groups, (draft: any) => {
          draft[groupDetails.index] = { ...draft[groupDetails.index],  ...images , isUploaded : false, createdAt: Date.now(), ...updatedGroupDetails }
          console.log(draft[groupDetails.index])

          return draft
        })
        return updatedGroups
      });

      return { previousGroups };
    },

    onError: (err, newGroup, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData(['groups'], context.previousGroups)
    },
    onSettled: (e) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
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


export const useRemoveGroup = () => {
  const { user } = useAppSelector((state) => state.user)
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (groupDetails: { groupId: string, groupIndex: number, images }) => {
      return removeGroup({ groupId: groupDetails.groupId, images: groupDetails.images })
    },

    onMutate: async ({ groupIndex, groupId }) => {
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      const previousGroups = queryClient.getQueryData(['groups'])

      queryClient.setQueryData(['groups'], (pages: any) => {
        const updatedGroups = produce(pages, (draft: any) => {

          if (draft[groupIndex]?._id == groupId) {
            draft.splice(groupIndex, 1)
            return draft
          }

          console.log('not')


          
        })
        return updatedGroups
      });

      return { previousGroups };
    },

    onError: (err, newGroup, context) => {
      console.log(err)
      toast.error("something went wrong")
      queryClient.setQueryData(['groups'], context.previousGroups)
    },
    onSettled: (e) => {
      
      queryClient.invalidateQueries({ queryKey: ["groups"] })
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


export function useGroupMembers(groupId: string): any {

  const { data, isLoading, isFetching, fetchNextPage, fetchPreviousPage, fetchStatus, isSuccess, isFetchingNextPage, error } = useInfiniteQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: ({ pageParam, }) => fetchGroupMembers(pageParam, groupId),
    enabled: !!groupId,
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



export const useJoinGroup = () => {
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (groupData: {groupDetails: {groupId: string, userId?: string, type: string}}) => {
      return toggleJoinGroup(groupData)
    },
    onMutate: async ({ groupDetails: {groupId} }) => {
      console.log(groupId)
      await queryClient.cancelQueries({ queryKey: ['group'] })
      const previousPage = queryClient.getQueryData(['group'])
      queryClient.setQueryData(['group'], (page: any) => {
        const updatedPage = produce(page, (draft: any) => {
          if (draft.isMember) {
            draft.isMember = false
            draft.membersCount = draft.membersCount - 1
            console.log(draft.membersCount)
            return draft
          }

          if (draft.isMember == false) {
            draft.isMember = true
            draft.membersCount = draft.membersCount + 1
            console.log(draft.membersCount)
            return draft
          }

          throw new Error()
        })
        return updatedPage
      });

      return { previousPage };
    },

    onError: (err, newComment, context) => {
      console.log(err, newComment)
      toast.error("something went wrong")
      queryClient.setQueryData(['page'], context.previousPage)
    },
    onSettled: (e) => {
      console.log(e)
      
      
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

export const useToggleAdmin = () => {
  
  const queryClient = useQueryClient()
  const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
    mutationFn: (groupDetails: { groupId: string, user: any, isAdmin?: boolean, index?: number, isChatGroup?: boolean }) => {
      return toggleGroupAdmin({ groupId: groupDetails.groupId, userId: groupDetails.user._id, isChatGroup: groupDetails?.isChatGroup })
    },
    onMutate: async ({ groupId, user, isAdmin, index }) => {
      console.log(groupId, user, isAdmin, index)
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
                  
      
      
      
      
      
      
      
      
      
      
      
      

      
      
      

      
    },

    onError: (err) => {
      console.log(err)
      toast.error("something went wrong")
      
    },
    onSettled: (e) => {
      console.log(e)
      
      queryClient.invalidateQueries({ queryKey: ["group"] })
      queryClient.invalidateQueries({ queryKey: ["chatgroup"] })
      queryClient.invalidateQueries({ queryKey: ["groupMembers"] })
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

