import { likePost, bookmarkPost } from "@/api/Post/posts";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBookamrks } from '@/hooks/Bookmarks/useBookmark';
import { useCallback, useEffect, useState } from 'react';
import { produce } from "immer";
import { fetchReelsFeed, fetchReels, fetchVideosFeed, createReel, updateReelPost, deleteReelPost } from "@/api/Reel/reel.api";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { createUploadStatus, removeUploadStatus } from "@/app/features/user/uploadStatusSlice";
import { toast } from "react-toastify";
import { PostType } from "@/utils/types/Post";

export function useReelsFeed(initialReelId = null) {
    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        fetchPreviousPage,
        fetchStatus,
        isSuccess,
        refetch,
        isFetchingNextPage,
        error,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['reelsFeed', initialReelId], 
        queryFn: ({ pageParam }) => fetchReelsFeed(pageParam, initialReelId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    });

    const pages = data?.pages ?? [];

    return {
        data: pages,
        isLoading,
        isSuccess,
        isFetching,
        fetchPreviousPage,
        isFetchingNextPage,
        fetchStatus,
        refetch,
        fetchNextPage,
        error,
        hasNextPage: !!pages[pages.length - 1]?.nextCursor,
    };
}

export function useVideosFeed(initialReelId) {
    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        fetchPreviousPage,
        fetchStatus,
        isSuccess,
        refetch,
        isFetchingNextPage,
        error,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['videosFeed', initialReelId], 
        queryFn: ({ pageParam }) => fetchVideosFeed(pageParam, initialReelId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    });

    const pages = data?.pages ?? [];

    return {
        data: pages,
        isLoading,
        isSuccess,
        isFetching,
        fetchPreviousPage,
        isFetchingNextPage,
        fetchStatus,
        refetch,
        fetchNextPage,
        error,
        hasNextPage: !!pages[pages.length - 1]?.nextCursor,
    };
}


export function useUserReels(targetId, type) {
    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        fetchPreviousPage,
        fetchStatus,
        isSuccess,
        isFetchingNextPage,
        refetch,
        error,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['userReels', targetId],
        queryFn: ({ pageParam }) => fetchReels(pageParam, targetId, type),
        enabled: !!targetId,
        refetchInterval: false,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined
    });

    const pages: any = data?.pages ?? [];

    return {
        data: pages,
        isLoading,
        isSuccess,
        isFetching,
        fetchPreviousPage,
        isFetchingNextPage,
        fetchStatus,
        fetchNextPage,
        refetch,
        error,
        hasNextPage: !!pages[pages.length - 1]?.nextCursor,
    };
}

interface QueryParams { userId?: string, initialReelId?: string, profileType?: string }

export const getQueryKeyForMode = (mode, params: QueryParams = {}) => {
    switch (mode) {
        case 'profile':
            return ['userReels', params.userId];
        case 'bookmarks':
            return ['userBookmarks', 'reel'];
        case 'videosFeed':
            return ['videosFeed', params.initialReelId];
        case 'single':
        case 'feed':
        default:
            return ['reelsFeed', params.initialReelId];
    }
};




export const useCreateReel = () => {
    const dispatch = useAppDispatch()
    const { data, isSuccess, isPending, mutate, mutateAsync } = useMutation({
        mutationFn: (formData: FormData) => {
            return createReel(formData)
        },

        onMutate: () => {
            dispatch(createUploadStatus("Reel is being uploaded"))
        },

        onError: (err) => {
            dispatch(removeUploadStatus())
            if (err instanceof Error) {
                toast.error(err.message)
            }
            else {
                toast.error("Something went wrong while uploading the reel")
            }
        },
    })

    return {
        data,
        isPending,
        isSuccess,
        mutateAsync,
        mutate
    }
}

export const useReelsDataSource = (mode = 'feed', params: QueryParams = {}) => {
    const queryClient = useQueryClient();

    
    const [dataInitialized, setDataInitialized] = useState(false);
    
    const [mergedData, setMergedData] = useState([]);
    
    const [hasMorePages, setHasMorePages] = useState(true);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingNext, setIsFetchingNext] = useState(false);

    
    let sourceQuery;

    console.log(`[ReelsData] Using mode: ${mode}, initialReelId: ${params.initialReelId}`, params);

    if (mode === 'profile') {
        sourceQuery = useUserReels(params.userId || '', params?.profileType || 'user');
    }
    else if (mode === 'bookmarks') {
        sourceQuery = useBookamrks();
    }
    else if (mode === 'videosFeed') {
        
        sourceQuery = useVideosFeed(params?.initialReelId);
    }
    else {
        
        sourceQuery = useReelsFeed(params?.initialReelId);
    }

    
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!sourceQuery.data || sourceQuery.data.length === 0) {
                console.log(`[ReelsData] No initial data for ${mode}, triggering fetch`);
                setIsLoading(true);
                try {
                    await sourceQuery.refetch();
                } catch (error) {
                    console.error(`[ReelsData] Error fetching initial data:`, error);
                }
            }
        };

        fetchInitialData();
    }, [mode, sourceQuery.refetch]);

    
    useEffect(() => {
        console.log(`[ReelsData] Source data updated for ${mode}:`, {
            hasSourceData: !!sourceQuery.data && sourceQuery.data.length > 0,
            isSourceLoading: sourceQuery.isLoading,
            sourceDataLength: sourceQuery.data?.length || 0
        });

        
        if (sourceQuery.data && sourceQuery.data.length > 0 && !sourceQuery.isLoading) {
            setIsLoading(false);
            setHasMorePages(!!sourceQuery.hasNextPage);
            setDataInitialized(true);
        }
    }, [mode, sourceQuery.data, sourceQuery.isLoading, sourceQuery.hasNextPage]);

    
    const getFallbackData = useCallback(() => {
        

        let fallbackData = [];

        if (sourceQuery.data && sourceQuery.data.length > 0) {
            if (mode === 'profile') {
                fallbackData = sourceQuery.data.flatMap(page =>
                    page?.posts?.map((reel, idx) => ({
                        ...reel,
                        id: reel._id || reel.id,
                        key: `fallback-${reel._id || reel.id}-${idx}`,
                        _sourceMode: mode,
                        mediaSrc: reel.media?.[0]?.url || null
                    })) || []
                );
            }
            else if (mode === 'bookmarks') {
                fallbackData = sourceQuery.data.flatMap(page =>
                    page?.bookmarks?.filter(item => item && item.post).map((item, idx) => ({
                        ...item.post,
                        target: item.target || item.post?.target || {},
                        user: item.user || item.post?.user || {},
                        id: item.post._id || item.post.id,
                        key: `fallback-${item.post._id || item.post.id}-${idx}`,
                        _sourceMode: mode,
                        mediaSrc: item.post.media?.[0]?.url || null
                    })) || []
                );
            }
            else {
                
                
                fallbackData = sourceQuery.data.flatMap(page =>
                    page?.posts?.map((reel, idx) => ({
                        ...reel,
                        id: reel._id || reel.id,
                        key: `fallback-${reel._id || reel.id}-${idx}`,
                        _sourceMode: mode,
                        mediaSrc: reel.media?.[0]?.url || null
                    })) || []
                );
            }
        }

        return fallbackData.length > 0 ? fallbackData : [];
    }, [sourceQuery.data, mode]);

    
    const finalData = getFallbackData();

    console.log(`[ReelsData] Returning ${finalData.length} items (${sourceQuery.data?.length || 0} source pages)`);

    return {
        data: finalData,
        isLoading: sourceQuery.isLoading || (finalData.length === 0 && !dataInitialized),
        refetch: sourceQuery.refetch,
        fetchNextPage: sourceQuery.fetchNextPage,
        isFetchingNextPage: sourceQuery.isFetchingNextPage,
        hasNextPage: hasMorePages,
        sourceMode: mode,
        sourceParams: params
    };
};


export const useUpdateReel = () => {
    const queryClient = useQueryClient();
    const { user } = useAppSelector((state) => state.user);
    const userId = user?._id || null;

    return useMutation({
        
        
        mutationFn: (postDetails: { postId: string, content: string }) => {
            return updateReelPost({
                postId: postDetails.postId,
                content: postDetails.content
            });
        },

        onMutate: async ({ postId, content }) => {
            console.log(`Editing reel: postId=${postId}, userId=${userId}`);

            
            const queryKey = ['userReels', userId];

            
            await queryClient.cancelQueries({ queryKey });

            
            const previousData = queryClient.getQueryData(queryKey);

            try {
                
                queryClient.setQueryData(queryKey, (oldData: any) => {
                    if (!oldData) return oldData;

                    return produce(oldData, (draft) => {
                        
                        for (let i = 0; i < draft.pages.length; i++) {
                            const page = draft.pages[i];
                            if (!page.posts) continue;

                            for (let j = 0; j < page.posts.length; j++) {
                                const post = page.posts[j];
                                if (post._id === postId) {
                                    
                                    post.content = content;
                                    post.isEdited = true; 
                                    return; 
                                }
                            }
                        }

                        
                        console.warn(`Could not find reel with ID ${postId} in cache`);
                    });
                });

                return { previousData };
            } catch (error) {
                console.error("Error updating cache for edit:", error);
                return { previousData };
            }
        },

        onError: (err, variables, context) => {
            console.error("Error editing post:", err);
            toast.error("Something went wrong when editing the post");

            
            const queryKey = ['userReels', variables['userId']];
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },

        onSuccess: () => {
            toast.success("Reel updated successfully");
        }
    });
};

export const useDeleteReel = () => {
    const queryClient = useQueryClient();
    const { user } = useAppSelector((state) => state.user);
    const userId = user?._id || null;

    return useMutation({
        
        
        mutationFn: ({ postId }: { postId: string }) => {
            return deleteReelPost({
                postId
            });
        },

        onMutate: async ({ postId }) => {
            console.log(`Deleting reel: postId=${postId}, userId=${userId}`);

            
            const queryKey = ['userReels', userId];

            
            await queryClient.cancelQueries({ queryKey });

            
            const previousData = queryClient.getQueryData(queryKey);

            try {
                
                queryClient.setQueryData(queryKey, (oldData: any) => {
                    if (!oldData) return oldData;

                    return produce(oldData, (draft) => {
                        
                        for (let i = 0; i < draft.pages.length; i++) {
                            const page = draft.pages[i];
                            if (!page.posts) continue;

                            
                            const postIndex = page.posts.findIndex(post => post._id === postId);

                            if (postIndex !== -1) {
                                
                                page.posts.splice(postIndex, 1);
                                return; 
                            }
                        }

                        
                        console.warn(`Could not find reel with ID ${postId} in cache`);
                    });
                });

                return { previousData };
            } catch (error) {
                console.error("Error updating cache for delete:", error);
                return { previousData };
            }
        },

        onError: (err, variables, context) => {
            console.error("Error deleting post:", err);
            toast.error("Something went wrong when deleting the post");

            
            const queryKey = ['userReels', variables['userId']];
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },

        onSuccess: () => {
            toast.success("Reel deleted successfully");
        }
    });
};

export const useLikeReelPost = (sourceMode = 'feed', initialReelId = null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postDetails: { postId: string, authorId?: string, postIndex: number, pageIndex: number, type: string, postType?: string, targetId: string, reaction?: string }) => {
            return likePost({
                postId: postDetails.postId,
                authorId: postDetails.authorId,
                type: postDetails?.type,
                postType: postDetails?.postType,
                targetId: postDetails.targetId,
                reaction: postDetails?.reaction
            });
        },

        onMutate: async ({ postId, postIndex, pageIndex, reaction, type, targetId }) => {
            console.log(`Liking reel: postId=${postId}, pageIndex=${pageIndex}, postIndex=${postIndex}, sourceMode=${sourceMode}`);

            
            const queryKey = getQueryKeyForMode(sourceMode, { userId: targetId, initialReelId });

            
            await queryClient.cancelQueries({ queryKey });

            
            const previousData = queryClient.getQueryData(queryKey);

            try {
                
                queryClient.setQueryData(queryKey, (pages: any) => {
                    if (!pages) return pages;

                    return produce(pages, (draft) => {
                        
                        if (sourceMode === 'bookmarks') {
                            
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.bookmarks) continue;

                                for (let j = 0; j < page.bookmarks.length; j++) {
                                    const bookmark = page.bookmarks[j];
                                    if (bookmark.post && bookmark.post._id === postId) {
                                        
                                        if (bookmark.post.isLikedByUser) {
                                            bookmark.post.isLikedByUser = false;
                                            bookmark.post.likesCount = Math.max(0, bookmark.post.likesCount - 1);
                                            bookmark.post.reaction = null;
                                        } else {
                                            bookmark.post.isLikedByUser = true;
                                            bookmark.post.likesCount = (bookmark.post.likesCount || 0) + 1;
                                            bookmark.post.reaction = reaction || 'like';
                                        }
                                        return; 
                                    }
                                }
                            }
                        }
                        
                        else if (sourceMode === 'profile') {
                            
                            if (draft.pages[pageIndex]?.posts?.[postIndex]?._id === postId) {
                                const post = draft.pages[pageIndex].posts[postIndex];

                                if (post.isLikedByUser) {
                                    post.isLikedByUser = false;
                                    post.likesCount = Math.max(0, post.likesCount - 1);
                                    post.reaction = null;
                                } else {
                                    post.isLikedByUser = true;
                                    post.likesCount = (post.likesCount || 0) + 1;
                                    post.reaction = reaction || 'like';
                                }
                                return; 
                            }

                            
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        if (post.isLikedByUser) {
                                            post.isLikedByUser = false;
                                            post.likesCount = Math.max(0, post.likesCount - 1);
                                            post.reaction = null;
                                        } else {
                                            post.isLikedByUser = true;
                                            post.likesCount = (post.likesCount || 0) + 1;
                                            post.reaction = reaction || 'like';
                                        }
                                        return; 
                                    }
                                }
                            }
                        }
                        
                        else {
                            
                            const isSuggested = draft.pages[pageIndex]?.isSuggested === true;
                            
                            if (draft.pages[pageIndex]?.posts?.[postIndex]?._id === postId) {
                                const post = draft.pages[pageIndex].posts[postIndex];

                                if (post.isLikedByUser) {
                                    post.isLikedByUser = false;
                                    post.likesCount = Math.max(0, post.likesCount - 1);
                                    post.reaction = null;
                                } else {
                                    post.isLikedByUser = true;
                                    post.likesCount = (post.likesCount || 0) + 1;
                                    post.reaction = reaction || 'like';
                                }
                                return; 
                            }

                            
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        if (post.isLikedByUser) {
                                            post.isLikedByUser = false;
                                            post.likesCount = Math.max(0, post.likesCount - 1);
                                            post.reaction = null;
                                        } else {
                                            post.isLikedByUser = true;
                                            post.likesCount = (post.likesCount || 0) + 1;
                                            post.reaction = reaction || 'like';
                                        }
                                        return; 
                                    }
                                }
                            }
                        }

                        
                        console.warn(`Could not find reel with ID ${postId} in cache`);
                    });
                });

                
                

                
                if (sourceMode === 'profile' || sourceMode === 'bookmarks') {
                    const feedData = queryClient.getQueryData(['reelsFeed']);
                    if (feedData) {
                        queryClient.setQueryData(['reelsFeed'], produce(feedData, (draft: any) => {
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        
                                        if (post.isLikedByUser) {
                                            post.isLikedByUser = false;
                                            post.likesCount = Math.max(0, post.likesCount - 1);
                                            post.reaction = null;
                                        } else {
                                            post.isLikedByUser = true;
                                            post.likesCount = (post.likesCount || 0) + 1;
                                            post.reaction = reaction || 'like';
                                        }
                                        break;
                                    }
                                }
                            }
                        }));
                    }
                }

                
                if ((sourceMode === 'feed' || sourceMode === 'bookmarks') && targetId) {
                    const profileKey = ['userReels', targetId];
                    const profileData = queryClient.getQueryData(profileKey);
                    if (profileData) {
                        queryClient.setQueryData(profileKey, produce(profileData, (draft: any) => {
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        
                                        if (post.isLikedByUser) {
                                            post.isLikedByUser = false;
                                            post.likesCount = Math.max(0, post.likesCount - 1);
                                            post.reaction = null;
                                        } else {
                                            post.isLikedByUser = true;
                                            post.likesCount = (post.likesCount || 0) + 1;
                                            post.reaction = reaction || 'like';
                                        }
                                        break;
                                    }
                                }
                            }
                        }));
                    }
                }

                
                if (sourceMode === 'feed' || sourceMode === 'profile') {
                    const bookmarksData = queryClient.getQueryData(['userBookmarks', 'reel']);
                    if (bookmarksData) {
                        queryClient.setQueryData(['userBookmarks', 'reel'], produce(bookmarksData, (draft: any) => {
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.bookmarks) continue;

                                for (let j = 0; j < page.bookmarks.length; j++) {
                                    const bookmark = page.bookmarks[j];
                                    if (bookmark.post && bookmark.post._id === postId) {
                                        
                                        if (bookmark.post.isLikedByUser) {
                                            bookmark.post.isLikedByUser = false;
                                            bookmark.post.likesCount = Math.max(0, bookmark.post.likesCount - 1);
                                            bookmark.post.reaction = null;
                                        } else {
                                            bookmark.post.isLikedByUser = true;
                                            bookmark.post.likesCount = (bookmark.post.likesCount || 0) + 1;
                                            bookmark.post.reaction = reaction || 'like';
                                        }
                                        break;
                                    }
                                }
                            }
                        }));
                    }
                }

                return { previousData };
            } catch (error) {
                console.error("Error updating cache for like:", error);
                return { previousData };
            }
        },

        onError: (err, variables, context) => {
            console.error("Error liking post:", err);
            toast.error("Something went wrong when liking the post");

            
            const queryKey = getQueryKeyForMode(sourceMode, { userId: variables.targetId });
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },

        onSettled: (data, error, variables) => {
            
            

            
            
        }
    });
};

export const useBookmarkReelPost = (sourceMode = 'feed', initialReelId = null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postDetails: { postId: string, targetId: string, type?: string, postType?: string, postIndex: number, pageIndex: number }) => {
            return bookmarkPost({
                postId: postDetails.postId,
                targetId: postDetails.targetId,
                type: postDetails.type || 'user',
                postType: postDetails?.postType
            });
        },

        onMutate: async ({ postId, pageIndex, postIndex, targetId, type }) => {
            console.log(`Bookmarking reel: postId=${postId}, pageIndex=${pageIndex}, postIndex=${postIndex}, sourceMode=${sourceMode}`);

            
            const queryKey = getQueryKeyForMode(sourceMode, { userId: targetId, initialReelId });

            
            await queryClient.cancelQueries({ queryKey });

            
            const previousData = queryClient.getQueryData(queryKey);

            try {
                
                queryClient.setQueryData(queryKey, (pages) => {
                    if (!pages) return pages;

                    return produce(pages, (draft: any) => {
                        
                        if (sourceMode === 'bookmarks') {
                            
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.bookmarks) continue;

                                for (let j = 0; j < page.bookmarks.length; j++) {
                                    const bookmark = page.bookmarks[j];
                                    if (bookmark.post && bookmark.post._id === postId) {
                                        
                                        bookmark.post.isBookmarkedByUser = !bookmark.post.isBookmarkedByUser;
                                        return; 
                                    }
                                }
                            }
                        }
                        
                        else {
                            
                            if (draft.pages[pageIndex]?.posts?.[postIndex]?._id === postId) {
                                const post = draft.pages[pageIndex].posts[postIndex];
                                post.isBookmarkedByUser = !post.isBookmarkedByUser;
                                return; 
                            }

                            
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        post.isBookmarkedByUser = !post.isBookmarkedByUser;
                                        console.log(`Updated bookmark status for postId ${postId} in cache`);
                                        return; 
                                    }
                                }
                            }
                        }

                        
                        console.warn(`Could not find reel with ID ${postId} in cache`);
                    });
                });

                
                

                
                if (sourceMode === 'profile' || sourceMode === 'bookmarks') {
                    const feedData = queryClient.getQueryData(['reelsFeed']);
                    if (feedData) {
                        queryClient.setQueryData(['reelsFeed'], produce(feedData, (draft: any) => {
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        post.isBookmarkedByUser = !post.isBookmarkedByUser;
                                        break;
                                    }
                                }
                            }
                        }));
                    }
                }

                
                if ((sourceMode === 'feed' || sourceMode === 'bookmarks') && targetId) {
                    const profileKey = ['userReels', targetId];
                    const profileData = queryClient.getQueryData(profileKey);
                    if (profileData) {
                        queryClient.setQueryData(profileKey, produce(profileData, (draft: any) => {
                            for (let i = 0; i < draft.pages.length; i++) {
                                const page = draft.pages[i];
                                if (!page.posts) continue;

                                for (let j = 0; j < page.posts.length; j++) {
                                    const post = page.posts[j];
                                    if (post._id === postId) {
                                        post.isBookmarkedByUser = !post.isBookmarkedByUser;
                                        break;
                                    }
                                }
                            }
                        }));
                    }
                }

                return { previousData };
            } catch (error) {
                console.error("Error updating cache for bookmark:", error);
                return { previousData };
            }
        },

        onError: (err, variables, context) => {
            console.error("Error bookmarking post:", err);
            toast.error("Something went wrong when bookmarking the post");

            
            const queryKey = getQueryKeyForMode(sourceMode, { userId: variables['targetId'] });
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },

        onSettled: (data, error, variables) => {
            
        }
    });
};


export const useLikeReelsFeedPost = (initialReelId = null) => {
    return useLikeReelPost('feed', initialReelId);
};

export const useLikeVideosFeedPost = (initialReelId = null) => {
    return useLikeReelPost('videosFeed', initialReelId);
};


export const useLikeProfileReelPost = (userId) => {
    return useLikeReelPost('profile');
};

export const useLikeBookmarkedReelPost = () => {
    return useLikeReelPost('bookmarks');
};


export const useBookmarkReelsFeedPost = (initialReelId = null) => {
    return useBookmarkReelPost('feed', initialReelId);
};

export const useBookmarkVideosFeedPost = (initialReelId = null) => {
    return useBookmarkReelPost('videosFeed', initialReelId);
};

export const useBookmarkProfileReelPost = (userId) => {
    return useBookmarkReelPost('profile');
};

export const useBookmarkBookmarkedReelPost = () => {
    return useBookmarkReelPost('bookmarks');
};