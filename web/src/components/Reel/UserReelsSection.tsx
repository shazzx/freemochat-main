import { useUserReels } from '@/hooks/Reels/useReels';
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReelsList from './ReelList';

// NotFound SVG Component (converted to web)
const NotFoundSvg = ({ text = "No Content" }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <svg 
      className="w-24 h-24 text-gray-400 mb-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M9 12l2 2 4-4" 
      />
    </svg>
    <p className="text-gray-500 text-lg font-medium">{text}</p>
  </div>
);

const UserReelsSection = ({ userId }) => {
  const navigate = useNavigate();

  // Fetch user reels
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useUserReels(userId);

  // Flatten the pages data for grid display
  const reelsList = useMemo(() => {
    if (!data) return [];

    return data?.flatMap(page => page.posts || []);
  }, [data]);

  const handleReelPress = useCallback((reel) => {
    // Get the entire current page of reels
    const currentPage = data?.pages?.[data.pages.length - 1] || { posts: [] };

    // Add a unique key to the reel to prevent scroll issues
    const enrichedReel = {
      ...reel,
      _navigationTimestamp: Date.now() // Add timestamp to make each navigation unique
    };

    navigate(`/reels/${reel._id}`, {
      state: {
        initialReelId: reel._id,
        reelData: enrichedReel,
        sourceMode: 'profile',
        userId: userId,
        reelIndex: reelsList.findIndex(item => item._id === reel._id),
        totalReels: reelsList.length,
        initialPage: currentPage
      }
    });
  }, [navigate, userId, data, reelsList]);

  // Empty state component
  const EmptyComponent = useCallback(() => (
    <div className="py-12 px-4">
      <NotFoundSvg text="No Reels" />
      <p className="mt-4 text-center text-muted-foreground">
        No reels have been created yet
      </p>
    </div>
  ), []);

  return (
    <div className="w-full">
      <ReelsList
        data={reelsList}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        onReelPress={handleReelPress}
        onRefresh={refetch}
        refreshing={isLoading && !isFetchingNextPage}
        headerTitle="My Reels"
        ListEmptyComponent={<EmptyComponent />}
      />
    </div>
  );
};

export default UserReelsSection;