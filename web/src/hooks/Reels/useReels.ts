// src/hooks/Reels/useReelsFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { axiosClient } from '@/api/axiosClient';

// Define the structure you expect for a Reel data object
interface ReelData {
    _id: string;
    media: { url: string; type: 'video' }[]; // Assuming only one video media per reel
    content?: string; // Caption
    user: { // Uploader's info
        _id: string;
        username: string;
        profile?: string; // Avatar URL
        firstname: string;
        lastname: string;
    };
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number; // New feature
    isLikedByUser: boolean; // Assuming your API returns this
    isBookmarkedByUser: boolean; // Assuming your API returns this
    createdAt: string;
    // Add any other relevant fields like audio source, etc.
}

interface ReelsFeedPage {
    reels: ReelData[];
    nextCursor: string | null; // Or whatever mechanism your pagination uses
}

export const useReelsFeed = () => {
    // You'll need to replace this API call and query key
    return useInfiniteQuery<ReelsFeedPage, Error>({
        queryKey: ['reelsFeed'],
        queryFn: async ({ pageParam }) => {
            const { data } = await axiosClient.get('/reels', {
                params: { cursor: pageParam } // Example pagination param
            });
            return data; // Assuming data structure matches ReelsFeedPage
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined, // Or your initial cursor
    });
};

// Placeholder hooks for mutations (similar to useLikeFeedPost, etc.)
// You will need to implement these with actual API calls for Reels
export const useLikeReel = (queryKey: any) => ({ mutate: (vars: any) => console.log('Like Reel:', vars), isPending: false });
export const useBookmarkReel = (queryKey: any) => ({ mutate: (vars: any) => console.log('Bookmark Reel:', vars), isPending: false });
// Add hooks for comments, share, report, delete, edit if needed