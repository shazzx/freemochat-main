import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPlayCircle } from 'react-icons/io5';
import { MdVideoLibrary } from 'react-icons/md';

const ReelItem = ({ reel, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const getThumbnailUrl = () => {
    if (reel?.media && reel?.media.length > 0) {
      if (reel.media[0].thumbnail) {
        return reel.media[0].thumbnail;
      }

      if (reel.media[0].url) {
        return reel.media[0].url;
      }
    }

    return null;
  };

  const FallbackContent = () => (
    <div 
      className="w-full h-full flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-300"
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="relative">
        <MdVideoLibrary 
          size={48} 
          color="#ffffff" 
          className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        />
        <IoPlayCircle 
          size={24} 
          color="#ffffff" 
          className="absolute -bottom-1 -right-1 opacity-90"
        />
      </div>
      <span 
        className="text-white text-xs font-medium opacity-70 group-hover:opacity-90 transition-opacity duration-300"
        style={{ fontSize: '12px', fontWeight: '500' }}
      >
        Video Reel
      </span>
    </div>
  );

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
      <div className="thumbnail-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt="Reel thumbnail"
            className="w-full h-full object-cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        ) : (
          <FallbackContent />
        )}

        <div
          className="overlay group-hover:bg-black/40 transition-colors duration-200"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: thumbnailUrl && !imageError ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
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
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

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

const ReelsList = ({
  data = [],
  fetchNextPage,
  hasNextPage = false,
  isLoading = false,
  isFetchingNextPage = false,
  onReelPress,
  ListEmptyComponent = null
}) => {
  const observerTarget = useRef(null);

  const formattedData = data?.filter(item => item?.media && item?.media.length > 0);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleReelPress = useCallback((reel) => {
    if (onReelPress) {
      onReelPress(reel);
    }
  }, [onReelPress]);

  useEffect(() => {
    if (!hasNextPage || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '100px', 
        threshold: 0.1 
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, fetchNextPage, handleLoadMore, isFetchingNextPage]);

  if (isLoading && !formattedData?.length) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
        {formattedData.map((reel) => (
          <ReelItem
            key={reel._id}
            reel={reel}
            onPress={handleReelPress}
          />
        ))}
      </div>

      <div
        ref={observerTarget}
        className="w-full py-6 flex justify-center"
      >
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        )}
      </div>

      {!isLoading && !formattedData?.length && ListEmptyComponent && (
        <div className="py-8">
          {ListEmptyComponent}
        </div>
      )}
    </div>
  );
};

export default ReelsList;