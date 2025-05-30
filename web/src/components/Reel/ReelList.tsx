import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ReelItem = ({ reel, onPress }) => {
  // Get thumbnail from media object
  const getThumbnailUrl = () => {
    if (reel?.media && reel?.media.length > 0) {
      // First check if thumbnail exists in first media item
      if (reel.media[0].thumbnail) {
        return reel.media[0].thumbnail;
      }

      // Fall back to video URL
      if (reel.media[0].url) {
        return reel.media[0].url;
      }
    }

    // Fallback placeholder
    return 'https://via.placeholder.com/300x500/333333/FFFFFF?text=Video';
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <div
      className="reel-item cursor-pointer group"
      onClick={() => onPress(reel)}
      style={{
        aspectRatio: '9/16',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        border: '1px solid rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail */}
      <div className="thumbnail-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <img
          src={thumbnailUrl}
          alt="Reel thumbnail"
          className="w-full h-full object-cover"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* Video Duration or Play Indicator */}
        <div
          className="overlay group-hover:bg-black/40 transition-colors duration-200"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="white"
            className="opacity-90 group-hover:scale-110 transition-transform duration-200"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* Gradient overlay for better contrast */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};

/**
 * ReelsList Component - Reusable component to display reels in a grid layout
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of reels to display
 * @param {Function} props.fetchNextPage - Function to fetch more reels
 * @param {Boolean} props.hasNextPage - Whether there are more reels to fetch
 * @param {Boolean} props.isLoading - Whether reels are being loaded
 * @param {Boolean} props.isFetchingNextPage - Whether next page is being fetched
 * @param {Function} props.onReelPress - Function to call when a reel is pressed
 * @param {Function} props.onRefresh - Function to call when pull-to-refresh
 * @param {Boolean} props.refreshing - Whether pull-to-refresh is active
 * @param {Boolean} props.showHeader - Whether to show the header
 * @param {String} props.headerTitle - Title for the header
 * @param {React.Component} props.ListEmptyComponent - Component to show when there are no reels
 * @returns {React.Component}
 */
const ReelsList = ({
  data = [],
  fetchNextPage,
  hasNextPage = false,
  isLoading = false,
  isFetchingNextPage = false,
  onReelPress,
  // onRefresh,
  // refreshing = false,
  // showHeader = true,
  // headerTitle = "Reels",
  ListEmptyComponent = null
}) => {
  // Create a ref for the intersection observer target
  const observerTarget = useRef(null);

  // Format data into rows with 3 columns (filter valid reels)
  const formattedData = data?.filter(item => item?.media && item?.media.length > 0);

  // Handle loading more reels when reaching end of list
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle reel press
  const handleReelPress = useCallback((reel) => {
    if (onReelPress) {
      onReelPress(reel);
    }
  }, [onReelPress]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    // Skip if no data or no more pages
    if (!hasNextPage || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If the target is intersecting (visible)
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          handleLoadMore();
        }
      },
      {
        // Options for the observer
        rootMargin: '100px', // Load more when user is 100px from bottom
        threshold: 0.1 // Trigger when 10% of the target is visible
      }
    );

    // Start observing the target element
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    // Cleanup
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, fetchNextPage, handleLoadMore, isFetchingNextPage]);

  // If loading and no data, show loader
  if (isLoading && !formattedData?.length) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      {/* {showHeader && (
        <div className="p-4 pb-3">
          <h3 className="text-lg font-semibold text-foreground m-0">
            {headerTitle}
          </h3>
        </div>
      )} */}

      {/* Grid Container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
        {formattedData.map((reel) => (
          <ReelItem
            key={reel._id}
            reel={reel}
            onPress={handleReelPress}
          />
        ))}
      </div>

      {/* Footer Loading - Now serves as observer target */}
      <div
        ref={observerTarget}
        className="w-full py-6 flex justify-center"
      >
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && !formattedData?.length && ListEmptyComponent && (
        <div className="py-8">
          {ListEmptyComponent}
        </div>
      )}
    </div>
  );
};

export default ReelsList;