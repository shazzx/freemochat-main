// ReelsContainer.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReelItem from './ReelItem';
import VideoPlaybackManager from './VideoPlaybackManager';
import videoViewTracker from './VideoViewTracker';
import { useReelsDataSource } from '@/hooks/Reels/useReels';
import { useAppSelector } from '@/app/hooks';
import AutoScrollControls from './AutoScrollControls';
import ShareSheet from './ShareSheet';
import ThreeDotsSheet from './ThreeDotsSheet';
// import ReportModal from './ReportModal';
const ReelsContainer: React.FC = () => {
  // Routing
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isComponentMounted = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const onEndReachedCalledDuringMomentumRef = useRef(false);
  const prefetchingInProgressRef = useRef(false);
  const scrollStartTimeRef = useRef(0);
  const activeVideoRef = useRef<string | null>(null);
  const autoScrollTimeoutRef = useRef<number | null>(null);
  const videoPlayStartTimeRef = useRef<number | null>(null);
  const hasVideoPlayedOnceRef = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // State
  const [currentReelId, setCurrentReelId] = useState<string | null>(null);
  const [sharedReel, setSharedReel] = useState(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [prefetchedVideos, setPrefetchedVideos] = useState(new Set());
  const [showPerformanceDebug, setShowPerformanceDebug] = useState(false);
  const [shareReelIndex, setShareReelIndex] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<null | 'comments' | 'share' | 'options'>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showAutoScrollControls, setShowAutoScrollControls] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    fileCount: 0,
    totalSizeMB: '0',
    usagePercentage: '0',
    hits: 0,
    misses: 0
  });

  // Get source mode from URL params
  const sourceMode = useMemo(() => {
    if (location.pathname.includes('profile')) return 'profile';
    if (location.pathname.includes('bookmarks')) return 'bookmarks';
    if (location.pathname.includes('videos')) return 'videosFeed';
    return 'feed';
  }, [location.pathname]);

  // Get user data from your auth store
  const { user } = useAppSelector((state) => state.user);

  // Extract source params from URL
  const sourceParams = useMemo(() => {
    return {
      userId: params.userId,
      reelData: location.state?.reelData,
      initialReelId: params.reelId
    };
  }, [params, location.state]);

  // Auto-scroll settings
  const [autoScrollReels, setAutoScrollReels] = useState({
    autoScroll: user?.autoScrollSettings?.autoScroll || false,
    autoScrollDelay: user?.autoScrollSettings?.autoScrollDelay || null,
  });

  // Fetch reels data
  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage
  } = useReelsDataSource(sourceMode, sourceParams);

  // Flatten the data
  const flattenedData = useMemo(() => {
    return data || [];
  }, [data]);

  // Find initial reel index
  const initialReelIndex = useMemo(() => {
    if (!flattenedData || flattenedData.length === 0) {
      return 0;
    }

    const markedIndex = flattenedData.findIndex(reel => reel.isInitialReel === true);
    if (markedIndex >= 0) {
      console.log(`Found marked initial reel at index ${markedIndex}`);
      return markedIndex;
    }

    if (sourceParams.initialReelId) {
      const idIndex = flattenedData.findIndex(reel => reel._id === sourceParams.initialReelId);
      if (idIndex >= 0) {
        console.log(`Found initial reel by ID at index ${idIndex}`);
        return idIndex;
      }
    }

    return 0;
  }, [flattenedData, sourceParams.initialReelId]);


  // Auto-scroll functionality
  const handleAutoScroll = useCallback((isFromLongPress = false) => {
    // Don't auto-scroll if in videosFeed mode
    if (sourceMode === 'videosFeed') {
      console.log('Auto-scroll prevented: videosFeed mode');
      return;
    }

    // Don't auto-scroll if a bottom sheet is open
    if (bottomSheetOpen) {
      console.log('Auto-scroll prevented: bottom sheet is open');
      return;
    }

    // If it's not from a long press, follow normal rules
    if (!isFromLongPress) {
      // Don't auto-scroll if the feature is disabled
      if (!autoScrollReels.autoScroll) {
        console.log('Auto-scroll disabled by settings');
        return;
      }
    } else {
      // It's from a long press - log this case specifically
      console.log('Auto-scrolling triggered by long press + video completion');
    }

    // Don't auto-scroll if we're at the last video
    if (activeReelIndex >= flattenedData.length - 1) {
      console.log('Already at last video, not scrolling');
      return;
    }

    console.log('Auto-scrolling to next reel');

    // Scroll to the next reel
    const nextReelElement = document.querySelector(`[data-index="${activeReelIndex + 1}"]`);
    if (nextReelElement) {
      nextReelElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [autoScrollReels.autoScroll, activeReelIndex, flattenedData, bottomSheetOpen]);

  const startAutoScrollTimer = useCallback(() => {
    // Clear any existing timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }


    if (sourceMode == 'videosFeed') {
      console.log('Auto-scroll prevented: videosFeed mode');
      return
    }

    // If auto-scroll is disabled, exit
    if (!autoScrollReels.autoScroll) return;

    // If a bottom sheet is open, don't start the timer
    if (bottomSheetOpen) {
      console.log('Auto-scroll timer not started: bottom sheet is open');
      return;
    }

    // If long press is active, completely bypass starting timer
    // This is crucial - we want to rely on video completion during long press
    if (longPressActive) {
      console.log('Auto-scroll using long press mode, timer will not start');
      return;
    }

    // NEW: If user has interacted with video via single tap, rely on video completion
    if (userInteracted) {
      console.log('User interacted with video, relying on video completion for auto-scroll');
      return;
    }

    // If delay is null, we'll rely on video completion (handled in ReelItem)
    if (autoScrollReels.autoScrollDelay === null) {
      console.log('Auto-scroll using video completion mode, not timer');
      return;
    }

    // If delay is 0 or not a positive number, exit
    if (!autoScrollReels.autoScrollDelay || autoScrollReels.autoScrollDelay <= 0) {
      console.log('Invalid delay value:', autoScrollReels.autoScrollDelay);
      return;
    }

    // Set the timeout for auto-scrolling
    const delayMs = autoScrollReels.autoScrollDelay * 1000; // Convert to milliseconds
    console.log(`Starting auto-scroll timer for ${delayMs}ms`);

    autoScrollTimeoutRef.current = setTimeout(() => {
      handleAutoScroll(false); // Pass false to indicate it's not from long press
    }, delayMs);

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, [autoScrollReels, handleAutoScroll, bottomSheetOpen, longPressActive, userInteracted]);

  // Setup intersection observer for detecting visible reels
  useEffect(() => {
    if (!containerRef.current) return;

    // Create intersection observer
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const reelId = entry.target.getAttribute('data-reel-id');
        const reelIndex = parseInt(entry.target.getAttribute('data-index') || '0');

        if (entry.isIntersecting && reelId) {
          // Update active reel when it becomes visible
          if (reelIndex !== activeReelIndex) {
            setActiveReelIndex(reelIndex);

            // Stop tracking previous video
            if (activeVideoRef.current) {
              console.log(`Stopping tracking for previous video ${activeVideoRef.current} on scroll`);
              if (sourceMode !== 'videosFeed') {
                videoViewTracker.updatePlaybackState(activeVideoRef.current, false);
                videoViewTracker.stopTracking(activeVideoRef.current);
              }
              activeVideoRef.current = null;
            }

            // Start tracking new video
            if (flattenedData[reelIndex]) {
              const currentVideo = flattenedData[reelIndex];
              if (currentVideo.id) {
                console.log(`Starting tracking for video ${currentVideo.id}`);

                if (sourceMode !== 'videosFeed') {
                  videoViewTracker.startTracking({
                    videoId: currentVideo.id,
                    type: 'video'
                  });
                }

                // Update reference to active video
                activeVideoRef.current = currentVideo.id;
              }

              // Start playing the active video
              const videoId = `reel-${currentVideo.id}`;
              VideoPlaybackManager.setCurrentlyPlaying(videoId, {
                reset: false,
                prefetchAdjacent: true,
                videos: flattenedData,
                currentIndex: reelIndex,
                checkForNextPage: true,
                loadNextPage: hasNextPage ? () => fetchNextPage() : null
              });

              // Reset auto-scroll state
              hasVideoPlayedOnceRef.current = false;
              videoPlayStartTimeRef.current = null;
              setUserInteracted(false);

              // Clear any existing timeout
              if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
                autoScrollTimeoutRef.current = null;
              }

              // Prefetch videos
              setTimeout(() => {
                prefetchVideosAround(reelIndex);
              }, 100);
            }
          }
        }
      });
    }, {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.7 // 70% visibility to consider it active
    });

    // Observe all reel items
    const reelElements = containerRef.current.querySelectorAll('.reel-item');
    reelElements.forEach(el => {
      observer.current?.observe(el);
    });

    return () => {
      observer.current?.disconnect();
    };
  }, [flattenedData, activeReelIndex, hasNextPage, fetchNextPage]);

  // Prefetch videos around the active index
  const prefetchVideosAround = useCallback((index, extraRange = 0) => {
    // Prefetching logic similar to original but adapted for web cache
    if (prefetchingInProgressRef.current || !flattenedData?.length) return;
    prefetchingInProgressRef.current = true;

    // Rest of prefetching implementation...
    // (Similar logic to the original but using WebCacheManager)

    prefetchingInProgressRef.current = false;
  }, [flattenedData, prefetchedVideos]);

  // Handle page visibility changes (equivalent to AppState in RN)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (equivalent to app going to background)
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
          autoScrollTimeoutRef.current = null;
        }

        // Pause videos
        VideoPlaybackManager.pauseCurrentlyPlaying();

        // Stop tracking current video and force send any pending batches
        if (activeVideoRef.current && (sourceMode !== 'videosFeed')) {
          videoViewTracker.stopTracking(activeVideoRef.current);
        }

        // Send pending view batches
        if (sourceMode !== 'videosFeed') {
          videoViewTracker.sendBatchToServer(true);
        }
      } else {
        // Page is visible again (equivalent to app coming to foreground)
        if (autoScrollReels.autoScroll && autoScrollReels.autoScrollDelay && hasVideoPlayedOnceRef.current) {
          startAutoScrollTimer();
        }

        // Resume playing the active video
        if (isScreenFocused && flattenedData[activeReelIndex]) {
          const currentVideo = flattenedData[activeReelIndex];
          if (currentVideo) {
            const videoId = `reel-${currentVideo.id}`;

            // Forced play with prefetch
            VideoPlaybackManager.setCurrentlyPlaying(videoId, {
              force: true,
              prefetchAdjacent: true,
              videos: flattenedData,
              currentIndex: activeReelIndex
            });

            // Resume tracking
            if (currentVideo.id && sourceMode !== 'videosFeed') {
              videoViewTracker.startTracking({
                videoId: currentVideo.id,
                type: 'video'
              });

              activeVideoRef.current = currentVideo.id;
            }

            // Prefetch videos
            prefetchVideosAround(activeReelIndex);
          }
        }
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScreenFocused, activeReelIndex, flattenedData, autoScrollReels, startAutoScrollTimer]);




  const updateVideoPlaybackState = useCallback((videoId, isPlaying) => {
    if (!videoId) return;

    console.log(`Updating playback state for video ${videoId}: ${isPlaying ? 'playing' : 'paused'}`);

    // Update video tracker as before
    (sourceMode !== 'videosFeed') && videoViewTracker.updatePlaybackState(videoId, isPlaying);

    // Only start auto-scroll timer if video is playing for the first time
    // AND we're not in long press mode
    if (isPlaying && !hasVideoPlayedOnceRef.current) {
      console.log('Video played for the first time, autoScroll:', autoScrollReels.autoScroll,
        'autoScrollDelay:', autoScrollReels.autoScrollDelay, 'longPressActive:', longPressActive);

      hasVideoPlayedOnceRef.current = true;
      videoPlayStartTimeRef.current = Date.now();

      // Only start auto-scroll timer if we're not in long press mode
      if (!longPressActive && autoScrollReels.autoScroll && autoScrollReels.autoScrollDelay !== null) {
        console.log('Starting auto-scroll timer');
        startAutoScrollTimer();
      } else if (longPressActive) {
        console.log('Not starting timer due to active long press');
      }
    }
  }, [startAutoScrollTimer, autoScrollReels, longPressActive]);

  // Component cleanup
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;

      // Make sure to stop tracking the active video first
      if (activeVideoRef.current) {
        // Stop tracking and ensure playback is set to false
        if (sourceMode !== 'videosFeed') {
          videoViewTracker.updatePlaybackState(activeVideoRef.current, false);
          videoViewTracker.stopTracking(activeVideoRef.current);
        }
        activeVideoRef.current = null;
      }

      // Force send all pending views
      if (sourceMode !== 'videosFeed') {
        videoViewTracker.sendBatchToServer(true);
      }

      // Full cleanup
      if (sourceMode !== 'videosFeed') {
        videoViewTracker.cleanup().catch(err => {
          console.error('Error during videoViewTracker cleanup:', err);
        });
      }

      // Clear timeouts
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [user, sourceMode]);

  // Handle user video interaction
  const handleUserVideoInteraction = useCallback(() => {
    setUserInteracted(true);

    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
  }, []);

  // Bottom sheet handlers
  const handleCommentsOpen = useCallback((reelId) => {
    setCurrentReelId(reelId);
    setBottomSheetOpen(true);
    setActiveSheet('comments');
  }, []);

  const handleShareOpen = useCallback((reel) => {
    setSharedReel(reel);
    setBottomSheetOpen(true);
    setActiveSheet('share');
  }, []);

  const handleOptionsOpen = useCallback((reelId) => {
    setCurrentReelId(reelId);
    setBottomSheetOpen(true);
    setActiveSheet('options');
  }, []);

  // Close active sheet
  const closeSheet = useCallback(() => {
    setBottomSheetOpen(false);
    setActiveSheet(null);
  }, []);

  // Render each reel item
  const renderReels = useMemo(() => {
    if (!flattenedData || flattenedData.length === 0) {
      return (
        <div className="flex justify-center items-center h-screen bg-black">
          <div className="text-white text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-4">No videos available</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-pink-600 rounded-lg text-white font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return flattenedData.map((reel, index) => (
      <ReelItem
        key={`${reel.key || reel._id}-${sourceMode}`}
        reel={reel}
        isActive={index === activeReelIndex && isScreenFocused}
        pageIndex={reel.pageIndex}
        reelIndex={reel.reelIndex}
        index={index}
        handleCommentsOpen={handleCommentsOpen}
        handleShareOpen={handleShareOpen}
        handleOptionsOpen={handleOptionsOpen}
        onPlaybackStateChange={updateVideoPlaybackState}
        onVideoComplete={handleAutoScroll}
        autoScrollEnabled={sourceMode !== "videosFeed" && autoScrollReels.autoScroll}
        onUserInteraction={handleUserVideoInteraction}
        onLongPressStateChange={setLongPressActive}
        className="reel-item h-screen w-full snap-start snap-always"
        data-reel-id={`reel-${reel.id}`}
        data-index={index}
      />
    ));
  }, [
    flattenedData,
    activeReelIndex,
    isScreenFocused,
    sourceMode,
    handleCommentsOpen,
    handleShareOpen,
    handleOptionsOpen,
    updateVideoPlaybackState,
    handleAutoScroll,
    autoScrollReels,
    handleUserVideoInteraction,
    refetch
  ]);

  if (isLoading && !flattenedData?.length) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Main Reels Container with Snap Scroll */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {renderReels}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-30 bg-black/30 p-2 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Auto-scroll Controls */}
      {showAutoScrollControls && (
        <AutoScrollControls
          autoScrollSettings={autoScrollReels}
          onSettingsChange={setAutoScrollReels}
          isVisible={showAutoScrollControls}
          setIsVisible={setShowAutoScrollControls}
        />
      )}

      {/* Bottom Sheets */}
      {activeSheet === 'comments' && (
        // <CommentsSheet
        //   isOpen={bottomSheetOpen && activeSheet === 'comments'}
        //   onClose={closeSheet}
        //   postId={currentReelId}
        // />
        <></>

      )}

      {activeSheet === 'share' && (
        <ShareSheet
          isOpen={bottomSheetOpen && activeSheet === 'share'}
          onClose={closeSheet}
          sharedPost={{ ...sharedReel, user: sharedReel?.target }}
          isReel={sourceMode !== 'videosFeed'}
        />
      )}

      {activeSheet === 'options' && (
        <ThreeDotsSheet
          isOpen={bottomSheetOpen && activeSheet === 'options'}
          onClose={closeSheet}
          postId={currentReelId}
          isReel={sourceMode !== 'videosFeed'}
          onShowAutoScrollSettings={() => setShowAutoScrollControls(true)}
          onReportPost={() => setReportModalVisible(true)}
        />
      )}
      {/* {bottomCommentsState && width < 540 &&
        <BottomComments pageIndex={0} params={params} postData={postData} postId={postData?._id} isOpen={bottomCommentsState} setOpen={setBottomCommentsState} />
      } */}
      {/* {reportModalVisible && (
        <ReportModal
          isOpen={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          userId={user?._id}
          postId={currentReelId}
          isReel={true}
        />
      )} */}
    </div>
  );
};

export default ReelsContainer;