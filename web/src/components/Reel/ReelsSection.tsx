import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReelItem from './ReelItem';
import VideoPlaybackManager from './VideoPlaybackManager';
import videoViewTracker from './VideoViewTracker';
import { useBookmarkBookmarkedReelPost, useBookmarkProfileReelPost, useBookmarkReelsFeedPost, useBookmarkVideosFeedPost, useLikeBookmarkedReelPost, useLikeProfileReelPost, useLikeReelsFeedPost, useLikeVideosFeedPost, useReelsDataSource, useUpdateReel } from '@/hooks/Reels/useReels';
import { useAppSelector } from '@/app/hooks';
import AutoScrollControls from './AutoScrollControls';
import ShareSheet from './ShareSheet';
import ThreeDotsSheet from './ThreeDotsSheet';
import BottomComments from '@/models/BottomComments';
import Comments from './Comments';
import ShareModel from '@/models/ShareModel';
import { toast } from 'react-toastify';
import BottomCreatePost from '@/models/BottomCreatePost';
import ThreeDotsModal from './ThreeDotsModal';
import ShareModal from '@/models/ShareModal';
import ShareBottomSheet from '@/models/ShareBottomSheet';
import ReportModel from '@/models/ReportModel';
import EditReel from '@/models/EditReelModal';
// import ReportModal from './ReportModal';


// const VideoTrackingDebug: React.FC<{
//   isVisible: boolean;
//   currentVideoId: string | null;
//   autoScrollSettings: any;
// }> = ({ isVisible, currentVideoId, autoScrollSettings }) => {
//   const [stats, setStats] = useState<any>(null);
//   const [refreshKey, setRefreshKey] = useState(0);

//   useEffect(() => {
//     if (!isVisible) return;

//     const interval = setInterval(() => {
//       const newStats = videoViewTracker.getStats();
//       setStats(newStats);
//       setRefreshKey(prev => prev + 1);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [isVisible, refreshKey]);

//   if (!isVisible || !stats) return null;

//   return (
//     <div className="fixed top-4 right-4 z-[9999] bg-black/90 text-white p-4 rounded-lg text-xs max-w-xs border border-gray-600">
//       <div className="flex justify-between items-center mb-2">
//         <h4 className="font-bold text-green-400">Video Tracking Debug</h4>
//         <div className="text-xs text-gray-400">#{refreshKey}</div>
//       </div>

//       <div className="space-y-1">
//         <div className="flex justify-between">
//           <span>User ID Set:</span>
//           <span className={stats.userIdSet ? 'text-green-400' : 'text-red-400'}>
//             {stats.userIdSet ? '✓' : '✗'}
//           </span>
//         </div>

//         <div className="flex justify-between">
//           <span>Periodic Check:</span>
//           <span className={stats.isPeriodicChecking ? 'text-green-400' : 'text-red-400'}>
//             {stats.isPeriodicChecking ? '✓' : '✗'}
//           </span>
//         </div>

//         <div className="flex justify-between">
//           <span>Active Tracking:</span>
//           <span className="text-blue-400">{stats.activeTrackingCount}</span>
//         </div>

//         <div className="flex justify-between">
//           <span>Pending Views:</span>
//           <span className="text-yellow-400">{stats.pendingViews}/{stats.batchSize}</span>
//         </div>

//         <div className="flex justify-between">
//           <span>Processing:</span>
//           <span className="text-orange-400">{stats.processingViews}</span>
//         </div>

//         <div className="flex justify-between">
//           <span>Total Sent:</span>
//           <span className="text-green-400">{stats.totalSentViews}</span>
//         </div>

//         {stats.lastBatchTime && (
//           <div className="text-xs text-gray-400">
//             Last Batch: {new Date(stats.lastBatchTime).toLocaleTimeString()}
//           </div>
//         )}

//         {stats.lastError && (
//           <div className="text-xs text-red-400 mt-2 p-2 bg-red-900/20 rounded">
//             Error: {stats.lastError.message}
//           </div>
//         )}

//         <hr className="border-gray-600 my-2" />

//         <div className="text-xs text-gray-400">
//           <div>Current Video: {currentVideoId || 'None'}</div>
//           <div>Auto-scroll: {autoScrollSettings.autoScroll ? '✓' : '✗'}</div>
//           <div>Delay: {autoScrollSettings.autoScrollDelay || 'Video End'}</div>
//         </div>
//       </div>
//     </div>
//   );
// };

const ReelsContainer: React.FC = () => {
  // Routing
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const isComponentMounted = useRef(true);
  const prefetchingInProgressRef = useRef(false);
  const activeVideoRef = useRef<string | null>(null);
  const autoScrollTimeoutRef = useRef<number | NodeJS.Timeout | null>(null);
  const videoPlayStartTimeRef = useRef<number | null>(null);
  const hasVideoPlayedOnceRef = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const initialScrollPerformedRef = useRef(false);

  // State
  const [currentReelId, setCurrentReelId] = useState<string | null>(null);
  const [sharedReel, setSharedReel] = useState(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [prefetchedVideos, setPrefetchedVideos] = useState(new Set());
  // const [showPerformanceDebug, setShowPerformanceDebug] = useState(false);
  // const [shareReelIndex, setShareReelIndex] = useState(null);
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
  const [showDebug, setShowDebug] = useState(false);


  // Get source mode from URL params
  const sourceMode = useMemo(() => {
    // Check if source mode is explicitly passed in location state (from feed suggestions)
    if (location.state?.sourceMode) {
      return location.state.sourceMode;
    }

    if (location.pathname.includes('profile')) return 'profile';
    if (location.pathname.includes('bookmarks')) return 'bookmarks';
    if (location.pathname.includes('videos')) return 'reelsFeed';
    return 'videosFeed';
  }, [location.pathname, location.state]);
  const { user } = useAppSelector((state) => state.user);

  const sourceParams = useMemo(() => {
    return {
      userId: user?._id,
      reelData: location.state?.reelData,
      initialReelId: location.state?.initialReelId || params.reelId, // Try state first, then params
      isSuggested: location.state?.reelData?.isSuggested || false
    };
  }, [params, location.state]);
  // Auto-scroll settings

  // Initialize mutation hooks
  const profileLikeMutation = useLikeProfileReelPost(sourceParams.userId);
  const profileBookmarkMutation = useBookmarkProfileReelPost(sourceParams.userId);

  const bookmarkLikeMutation = useLikeBookmarkedReelPost();
  const bookmarkBookmarkMutation = useBookmarkBookmarkedReelPost();

  const feedLikeMutation = useLikeReelsFeedPost(sourceParams.initialReelId);
  const feedBookmarkMutation = useBookmarkReelsFeedPost(sourceParams.initialReelId);

  const videosFeedLikeMutation = useLikeVideosFeedPost(sourceParams.initialReelId);
  const videosFeedBookmarkMutation = useBookmarkVideosFeedPost(sourceParams.initialReelId);

  const [autoScrollReels, setAutoScrollReels] = useState({
    autoScroll: user?.autoScrollSettings?.autoScroll || false,
    autoScrollDelay: user?.autoScrollSettings?.autoScrollDelay || null,
  });

  const useScreenSize = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkScreenSize = () => {
        setIsMobile(window.innerWidth < 964);
      };

      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return isMobile;
  };

  const isMobile = useScreenSize();
  const [updateReelActive, setUpdateReelActive] = useState(false)

  // Fetch reels data
  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage
  } = useReelsDataSource(sourceMode, sourceParams);


  const updateReel = useUpdateReel()

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

  // Scroll to initial reel without smooth scrolling for profile or bookmark modes
  useEffect(() => {
    if (!flattenedData || flattenedData.length === 0 || isLoading || initialScrollPerformedRef.current) {
      return;
    }

    // Check if we need to scroll to a specific reel
    if (initialReelIndex > 0 && sourceParams.initialReelId && (sourceMode === 'profile' || sourceMode === 'bookmark' || sourceMode === 'bookmarks')) {
      console.log(`Scrolling directly to reel at index ${initialReelIndex} without smooth scrolling`);

      // Find the target element
      const targetElement = document.querySelector(`[data-index="${initialReelIndex}"]`);
      if (targetElement && containerRef.current) {
        // Use instant scroll with auto behavior (no smooth scrolling)
        targetElement.scrollIntoView({
          behavior: 'auto',
          block: 'start'
        });

        // Mark that we've performed the initial scroll
        initialScrollPerformedRef.current = true;
      }
    }
  }, [flattenedData, initialReelIndex, sourceParams.initialReelId, sourceMode, isLoading]);

  // Auto-scroll functionality
  const handleAutoScroll = useCallback((isFromLongPress = false) => {
    if (bottomSheetOpen) {
      console.log('Auto-scroll prevented: bottom sheet is open');
      return;
    }

    // FIXED: Enhanced logic for different interaction modes
    if (!isFromLongPress) {
      // Not from long press - follow normal rules
      if (!autoScrollReels.autoScroll) {
        console.log('Auto-scroll disabled by settings');
        return;
      }
    } else {
      // From long press - always allow if long press was active
      console.log('Auto-scrolling triggered by long press + video completion');
    }

    // Don't auto-scroll if we're at the last video
    if (activeReelIndex >= flattenedData.length - 1) {
      console.log('Already at last video, not scrolling');
      return;
    }

    console.log('Auto-scrolling to next reel');

    // Clear any existing timer since we're now scrolling
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }

    // Scroll to the next reel
    const nextReelElement = document.querySelector(`[data-index="${activeReelIndex + 1}"]`);
    if (nextReelElement) {
      nextReelElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [autoScrollReels.autoScroll, activeReelIndex, flattenedData, bottomSheetOpen, sourceMode]);

  // REPLACE the startAutoScrollTimer function in ReelsContainer.tsx (around line 200)
  // WITH this improved version:

  const startAutoScrollTimer = useCallback(() => {
    // Clear any existing timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }

    // If auto-scroll is disabled, exit
    if (!autoScrollReels.autoScroll) return;

    // If a bottom sheet is open, don't start the timer
    if (bottomSheetOpen) {
      console.log('Auto-scroll timer not started: bottom sheet is open');
      return;
    }

    // FIXED: If long press is active, completely bypass timer - rely ONLY on video completion
    if (longPressActive) {
      console.log('Long press active: bypassing timer, will auto-scroll ONLY on video completion');
      return;
    }

    // FIXED: If user has interacted with video via single tap, rely on video completion
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
      // FIXED: Double-check long press state before executing
      if (longPressActive) {
        console.log('Auto-scroll timer fired but long press is active - canceling');
        return;
      }

      handleAutoScroll(false); // Pass false to indicate it's not from long press
    }, delayMs);

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, [autoScrollReels, handleAutoScroll, bottomSheetOpen, longPressActive, userInteracted]);

  // REPLACE the updateVideoPlaybackState function in ReelsContainer.tsx (around line 350)
  // WITH this improved version:

  const updateVideoPlaybackState = useCallback((videoId, isPlaying) => {
    if (!videoId) return;

    console.log(`Updating playback state for video ${videoId}: ${isPlaying ? 'playing' : 'paused'}`);

    // Update video tracker as before
    videoViewTracker.updatePlaybackState(videoId, isPlaying);

    // Only start auto-scroll timer if video is playing for the first time
    if (isPlaying && !hasVideoPlayedOnceRef.current) {
      console.log('Video played for the first time, autoScroll:', autoScrollReels.autoScroll,
        'autoScrollDelay:', autoScrollReels.autoScrollDelay, 'longPressActive:', longPressActive,
        'userInteracted:', userInteracted);

      hasVideoPlayedOnceRef.current = true;
      videoPlayStartTimeRef.current = Date.now();

      // FIXED: Determine auto-scroll behavior based on user interaction and settings
      if (autoScrollReels.autoScroll) {
        if (longPressActive) {
          // Long press active: ONLY rely on video completion, NO timer
          console.log('Long press active: will auto-scroll ONLY on video completion (no timer)');
          // Explicitly clear any existing timer to be safe
          if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
            autoScrollTimeoutRef.current = null;
          }
        } else if (userInteracted) {
          // User tapped once: ignore delay, only scroll on video completion
          console.log('User interacted: ignoring delay, will auto-scroll ONLY on video completion');
          // Explicitly clear any existing timer
          if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
            autoScrollTimeoutRef.current = null;
          }
        } else if (autoScrollReels.autoScrollDelay !== null && autoScrollReels.autoScrollDelay > 0) {
          // Normal auto-scroll with delay
          console.log('Starting auto-scroll timer with delay:', autoScrollReels.autoScrollDelay);
          startAutoScrollTimer();
        } else {
          // Auto-scroll on video completion (delay is null)
          console.log('Auto-scroll on video completion mode');
        }
      }
    }
  }, [startAutoScrollTimer, autoScrollReels, longPressActive, userInteracted, sourceMode]);

  // REPLACE the handleAutoScroll function in ReelsContainer.tsx (around line 150)
  // WITH this improved version:


  // REPLACE THIS ENTIRE useEffect in ReelsContainer.tsx (Component cleanup section):

  // useEffect(() => {
  //   // Set user ID for video view tracking when component mounts
  //   if (user?._id) {
  //     videoViewTracker.setUserId(user._id);
  //     videoViewTracker.startPeriodicChecking();
  //     videoViewTracker.setDebug(process.env.NODE_ENV === 'development'); // Enable debug in dev mode
  //     console.log('Video view tracking initialized for user:', user._id);
  //   }

  //   return () => {
  //     isComponentMounted.current = false;

  //     // Make sure to stop tracking the active video first
  //     if (activeVideoRef.current) {
  //       // Stop tracking and ensure playback is set to false

  //       videoViewTracker.updatePlaybackState(activeVideoRef.current, false);
  //       videoViewTracker.stopTracking(activeVideoRef.current);
  //       activeVideoRef.current = null;
  //     }

  //     // Force send all pending views
  //     videoViewTracker.sendBatchToServer(true);

  //     // Full cleanup
  //     videoViewTracker.cleanup().catch(err => {
  //       console.error('Error during videoViewTracker cleanup:', err);
  //     });

  //     // Clear timeouts
  //     if (autoScrollTimeoutRef.current) {
  //       clearTimeout(autoScrollTimeoutRef.current);
  //     }
  //   };
  // }, [user, sourceMode]);

  // REPLACE the intersection observer useEffect in ReelsContainer.tsx (around line 280)
  // FROM the existing intersection observer setup
  // TO this optimized version:

  useEffect(() => {
    if (!containerRef.current || !flattenedData?.length) return;

    // Create intersection observer with mobile-optimized settings
    observer.current = new IntersectionObserver((entries) => {
      // Use requestAnimationFrame to batch DOM updates
      requestAnimationFrame(() => {
        entries.forEach(entry => {
          const reelId = entry.target.getAttribute('data-reel-id');
          const reelIndex = parseInt(entry.target.getAttribute('data-index') || '0');

          // FIXED: Allow re-activation of same reel and use lower threshold for mobile
          if (entry.isIntersecting && reelId) {
            // Only skip if it's already the active reel AND it's currently playing
            const isAlreadyActiveAndPlaying = reelIndex === activeReelIndex &&
              flattenedData[reelIndex] &&
              !VideoPlaybackManager.isVideoManuallyPaused(`reel-${flattenedData[reelIndex].id}`);

            if (!isAlreadyActiveAndPlaying) {
              console.log(`Video ${reelIndex} became active (was ${activeReelIndex})`);
              setActiveReelIndex(reelIndex);

              // Stop tracking previous video
              if (activeVideoRef.current) {
                videoViewTracker.updatePlaybackState(activeVideoRef.current, false);
                videoViewTracker.stopTracking(activeVideoRef.current);
                activeVideoRef.current = null;
              }

              // Start tracking new video
              const currentVideo = flattenedData[reelIndex];
              if (currentVideo?.id) {
                videoViewTracker.startTracking({
                  videoId: currentVideo.id,
                  type: 'video'
                });
                activeVideoRef.current = currentVideo.id;
              }

              // Start playing the active video
              if (currentVideo) {
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
                setLongPressActive(false);

                // Clear any existing timeout
                if (autoScrollTimeoutRef.current) {
                  clearTimeout(autoScrollTimeoutRef.current);
                  autoScrollTimeoutRef.current = null;
                }

                // Defer prefetching to avoid blocking main thread
                setTimeout(() => prefetchVideosAround(reelIndex), 200);
              }
            }
          } else if (!entry.isIntersecting && reelIndex === activeReelIndex) {
            // FIXED: Properly handle video going out of view
            console.log(`Video ${reelIndex} went out of view`);

            // Stop the video that went out of view
            const currentVideo = flattenedData[reelIndex];
            if (currentVideo) {
              const videoId = `reel-${currentVideo.id}`;
              VideoPlaybackManager.pauseCurrentlyPlaying();
            }
          }
        });
      });
    }, {
      root: containerRef.current,
      threshold: [0.4, 0.6, 0.8], // Multiple thresholds for better mobile detection
      rootMargin: '-60px 0px -60px 0px' // Fixed pixels instead of % for mobile UI
    });

    // Observe all reel items
    const reelElements = containerRef.current.querySelectorAll('.reel-item');
    reelElements.forEach(el => {
      observer.current?.observe(el);
    });

    return () => {
      observer.current?.disconnect();
    };
  }, [flattenedData?.length, hasNextPage, fetchNextPage, sourceMode, activeReelIndex]); // Added activeReelIndex dependency
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
        if (activeVideoRef.current) {
          videoViewTracker.stopTracking(activeVideoRef.current);
        }

        // Send pending view batches
        videoViewTracker.sendBatchToServer(true);
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
            if (currentVideo.id) {
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




  // const updateVideoPlaybackState = useCallback((videoId, isPlaying) => {
  //   if (!videoId) return;

  //   console.log(`Updating playback state for video ${videoId}: ${isPlaying ? 'playing' : 'paused'}`);

  //   // Update video tracker as before
  //    videoViewTracker.updatePlaybackState(videoId, isPlaying);

  //   // Only start auto-scroll timer if video is playing for the first time
  //   // AND we're not in long press mode
  //   if (isPlaying && !hasVideoPlayedOnceRef.current) {
  //     console.log('Video played for the first time, autoScroll:', autoScrollReels.autoScroll,
  //       'autoScrollDelay:', autoScrollReels.autoScrollDelay, 'longPressActive:', longPressActive);

  //     hasVideoPlayedOnceRef.current = true;
  //     videoPlayStartTimeRef.current = Date.now();

  //     // Only start auto-scroll timer if we're not in long press mode
  //     if (!longPressActive && autoScrollReels.autoScroll && autoScrollReels.autoScrollDelay !== null) {
  //       console.log('Starting auto-scroll timer');
  //       startAutoScrollTimer();
  //     } else if (longPressActive) {
  //       console.log('Not starting timer due to active long press');
  //     }
  //   }
  // }, [startAutoScrollTimer, autoScrollReels, longPressActive]);



  // Component cleanup



  // useEffect(() => {
  //   return () => {
  //     isComponentMounted.current = false;

  //     // Make sure to stop tracking the active video first
  //     if (activeVideoRef.current) {
  //       // Stop tracking and ensure playback is set to false
  //       videoViewTracker.updatePlaybackState(activeVideoRef.current, false);
  //       videoViewTracker.stopTracking(activeVideoRef.current);
  //       activeVideoRef.current = null;
  //     }

  //     // Force send all pending views
  //     videoViewTracker.sendBatchToServer(true);

  //     // Full cleanup
  //     videoViewTracker.cleanup().catch(err => {
  //       console.error('Error during videoViewTracker cleanup:', err);
  //     });

  //     // Clear timeouts
  //     if (autoScrollTimeoutRef.current) {
  //       clearTimeout(autoScrollTimeoutRef.current);
  //     }
  //   };
  // }, [user, sourceMode]);

  // Handle user video interaction
  const handleUserVideoInteraction = useCallback(() => {
    setUserInteracted(true);

    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
  }, []);

  const handleReelAction = useCallback((actionType, reel) => {
    console.log(`[DEBUG] ${actionType} action on reel:`, {
      reelId: reel._id,
      sourceMode,
      currentIndex: activeReelIndex
    });
  }, [activeReelIndex, sourceMode]);

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

  const downloadVideo = async () => {
    console.log('Downloading video for post:', flattenedData[activeReelIndex]?._id);
    if (!flattenedData[activeReelIndex]?.media) {
      toast.error("Download failed");
      return;
    }

    try {

      const response = await fetch(flattenedData[activeReelIndex].media[0]?.watermarkUrl ?? flattenedData[activeReelIndex].media[0]?.url);
      if (!response.ok) throw new Error('Failed to fetch video');

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freedombook-video-${flattenedData[activeReelIndex]._id}.mp4`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.info("Your download will begin shortly");

    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || "An error occurred while downloading the video");
    }
  };


  // Render each reel item
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

    return flattenedData.map((reel, index) => {
      const isActive = index === activeReelIndex && isScreenFocused;

      // Check if this is a suggested reel
      const isSuggested = !!reel.isSuggested;

      // Determine appropriate like and bookmark functions based on source
      let likeMutationHook;
      let bookmarkMutationHook;

      if (sourceMode === 'profile') {
        likeMutationHook = profileLikeMutation;
        bookmarkMutationHook = profileBookmarkMutation;
      }
      else if (sourceMode === 'bookmarks') {
        likeMutationHook = bookmarkLikeMutation;
        bookmarkMutationHook = bookmarkBookmarkMutation;
      }
      else if (sourceMode === 'videosFeed') {
        likeMutationHook = videosFeedLikeMutation;
        bookmarkMutationHook = videosFeedBookmarkMutation;
      }
      else if (isSuggested) {
        // For suggested reels, use the feed hooks
        likeMutationHook = feedLikeMutation;
        bookmarkMutationHook = feedBookmarkMutation;
      }
      else {
        // Default feed mode
        likeMutationHook = feedLikeMutation;
        bookmarkMutationHook = feedBookmarkMutation;
      }

      // Normalize the reel data with better defaults
      const normalizedReel = {
        ...reel,
        // Ensure targetId is present
        targetId: reel.targetId || (reel.target && reel.target._id) || '',
        // Normalize type with a default
        type: reel.type || 'user',
        postType: reel.postType || 'post',
        // Handle counts with defaults to prevent NaN
        likesCount: typeof reel.likesCount === 'number' ? reel.likesCount : 0,
        commentsCount: typeof reel.commentsCount === 'number' ? reel.commentsCount : 0,
        sharesCount: typeof reel.sharesCount === 'number' ? reel.sharesCount : 0,
        videoViewsCount: typeof reel.videoViewsCount === 'number' ? reel.videoViewsCount : 0,
        // Set boolean flags safely
        isLikedByUser: !!reel.isLikedByUser,
        isBookmarkedByUser: !!reel.isBookmarkedByUser,
        // Ensure media exists
        media: reel.media || [],
        // Ensure target exists
        target: reel.target || {},
        // Add debugging info
        _isSuggested: isSuggested,
        _sourceMode: sourceMode
      };

      return (
        <ReelItem
          key={`${reel.key || reel._id}-${sourceMode}`}
          reel={normalizedReel}
          isActive={isActive}
          pageIndex={reel.pageIndex}
          reelIndex={reel.reelIndex}
          index={index}
          handleCommentsOpen={handleCommentsOpen}
          handleShareOpen={handleShareOpen}
          handleOptionsOpen={handleOptionsOpen}
          // Pass the mutation hooks
          useLikeReel={likeMutationHook}
          useBookmarkReel={bookmarkMutationHook}
          onPlaybackStateChange={updateVideoPlaybackState}
          onVideoComplete={handleAutoScroll}
          autoScrollEnabled={sourceMode !== "videosFeed" && autoScrollReels.autoScroll}
          onUserInteraction={handleUserVideoInteraction}
          onLongPressStateChange={handleUserVideoInteraction}
          className="reel-item h-screen w-full snap-start snap-always"
          data-reel-id={`reel-${reel.id}`}
          data-index={index}
        />
      );
    });
  }, [
    flattenedData,
    activeReelIndex,
    isScreenFocused,
    sourceMode,
    sourceParams,
    profileLikeMutation,
    profileBookmarkMutation,
    bookmarkLikeMutation,
    bookmarkBookmarkMutation,
    feedLikeMutation,
    feedBookmarkMutation,
    videosFeedLikeMutation,
    videosFeedBookmarkMutation,
    handleCommentsOpen,
    handleShareOpen,
    handleOptionsOpen,
    updateVideoPlaybackState,
    handleAutoScroll,
    autoScrollReels,
    handleUserVideoInteraction,
    handleReelAction,
    setLongPressActive,
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

  // REPLACE the main container div in ReelsContainer.tsx (around line 650)
  // FROM:
  //   <div className="relative h-screen w-full bg-black overflow-hidden">
  //     <div ref={containerRef} className="h-full w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
  // TO this mobile-optimized version:

  return (
    <div className='flex'>
      {/* Debug controls remain the same */}
      {showDebug && (
        <div className="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2">
          <button
            onClick={() => {
              if (activeVideoRef.current) {
                videoViewTracker.sendBatchToServer(true);
                console.log('Manual batch send triggered');
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
          >
            Force Send Views
          </button>

          <button
            onClick={() => {
              console.log('Current video tracking stats:', videoViewTracker.getStats());
              console.log('Active video ref:', activeVideoRef.current);
              console.log('Auto-scroll settings:', autoScrollReels);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium"
          >
            Log Stats
          </button>
        </div>
      )}

      {/* FIXED: Mobile-optimized container with dynamic viewport height */}
      <div
        className="relative w-full bg-black overflow-hidden"
        style={{
          // Use dynamic viewport height for mobile compatibility
          height: 'calc(100dvh)', // Dynamic viewport height
          minHeight: 'calc(100vh)', // Fallback for older browsers
          maxHeight: 'calc(100dvh)', // Ensure it doesn't exceed
        }}
      >
        {/* Main Reels Container with Snap Scroll - FIXED */}
        <div
          ref={containerRef}
          className="w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory reels-scrollbar-hide"
          style={{
            height: '100%',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y', // Better mobile scrolling
            overscrollBehavior: 'contain', // Prevent bounce
          }}
        >
          <style>{`
            .reels-scrollbar-hide::-webkit-scrollbar {
              display: none;
          }`}</style>

          {renderReels}
        </div>

        {/* Back Button - FIXED positioning for mobile */}
        <button
          onClick={() => navigate(-1)}
          className="absolute flex items-center justify-center gap-2 top-4 left-4 z-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white rounded-full p-2 bg-black/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {(activeReelIndex == 0) &&
            <span className="text-white">
              Videos
            </span>
          }
        </button>

        {/* Rest of the component remains the same... */}
        {/* Auto-scroll Controls */}
        {showAutoScrollControls && (
          <AutoScrollControls
            autoScrollSettings={autoScrollReels}
            onSettingsChange={setAutoScrollReels}
            isVisible={showAutoScrollControls}
            setIsVisible={setShowAutoScrollControls}
          />
        )}


        {isMobile && updateReelActive &&
          <BottomCreatePost
            setModelTrigger={setUpdateReelActive}
            updatePost={({ postId, content }: { postId: string, content: string }) => {
              updateReel.mutate({ postId: postId, content: content })
              setUpdateReelActive(false)
            }}
            editPost={true}
            postDetails={flattenedData && flattenedData[activeReelIndex]}
            postId={flattenedData && flattenedData[activeReelIndex]?._id}
            isReel={false} />
        }


        {!isMobile && updateReelActive &&
          <EditReel
            setModelTrigger={setUpdateReelActive}
            updatePost={({ postId, content }: { postId: string, content: string }) => {
              updateReel.mutate({ postId: postId, content: content })
              setUpdateReelActive(false)
            }}
            editPost={true}
            postDetails={flattenedData && flattenedData[activeReelIndex]}
            postId={flattenedData && flattenedData[activeReelIndex]?._id}
            isReel={false} />
        }


        {/* Bottom Sheets and other components remain unchanged */}
        {activeSheet === 'comments' && isMobile && (
          <BottomComments
            isReel={false}
            pageIndex={flattenedData && flattenedData[activeReelIndex]?.pageIndex}
            params={{
              type: 'userPosts',
              targetId: flattenedData && flattenedData[activeReelIndex]?.targetId,
              postId: flattenedData && flattenedData[activeReelIndex]?._id,
              reelsKey: [sourceMode, sourceParams?.initialReelId]
            }}
            postData={flattenedData && flattenedData[activeReelIndex]}
            postId={flattenedData && flattenedData[activeReelIndex]?._id}
            isOpen={activeSheet && true}
            setOpen={setActiveSheet}
          />
        )}

        {activeSheet === 'share' && !isMobile && (
          <ShareModal
            isReel={false}
            key={'user' + "Posts"}
            isOpen={true}
            sharedPost={flattenedData && (flattenedData[activeReelIndex])}
            postId={flattenedData[activeReelIndex]?._id}
            postType={flattenedData[activeReelIndex]?.type}
            handleDownload={downloadVideo}
            onClose={closeSheet}
          />
        )}


        {activeSheet === 'share' && isMobile && (
          <ShareBottomSheet
            isReel={false}
            key={'user' + "Posts"}
            isOpen={true}
            sharedPost={flattenedData && (flattenedData[activeReelIndex])}
            postId={flattenedData[activeReelIndex]?._id}
            postType={flattenedData[activeReelIndex]?.type}
            handleDownload={downloadVideo}
            onClose={closeSheet}
          />
        )}

        {reportModalVisible &&
          <ReportModel
            postId={flattenedData && flattenedData[activeReelIndex]?._id}
            setModelTrigger={setReportModalVisible}
          />
        }

        {activeSheet === 'options' && isMobile && (
          <ThreeDotsSheet
            isOpen={bottomSheetOpen && activeSheet === 'options'}
            isProfileAndOwner={(sourceMode == 'profile') && (user?._id == flattenedData[activeReelIndex]?.user)}
            onClose={closeSheet}
            setUpdateReelActive={setUpdateReelActive}
            postId={currentReelId}
            isReel={false}
            onShowAutoScrollSettings={() => setShowAutoScrollControls(true)}
            onReportPost={() => setReportModalVisible(true)}
          />
        )}

        {activeSheet === 'options' && !isMobile && (
          <ThreeDotsModal
            isOpen={bottomSheetOpen && activeSheet === 'options'}
            isProfileAndOwner={(sourceMode == 'profile') && (user?._id == flattenedData[activeReelIndex]?.user)}
            onClose={closeSheet}
            setUpdateReelActive={setUpdateReelActive}
            postId={currentReelId}
            isReel={false}
            onShowAutoScrollSettings={() => setShowAutoScrollControls(true)}
            onReportPost={() => setReportModalVisible(true)}
          />
        )}
      </div>

      {/* Desktop comments section remains the same */}
      {!isMobile && (
        <Comments
          isReel={false}
          pageIndex={flattenedData && flattenedData[activeReelIndex]?.pageIndex}
          params={{
            type: 'userPosts',
            targetId: flattenedData && flattenedData[activeReelIndex]?.targetId,
            postId: flattenedData && flattenedData[activeReelIndex]?._id,
            reelsKey: [sourceMode, sourceParams?.initialReelId]
          }}
          postData={flattenedData && flattenedData[activeReelIndex]}
          postId={flattenedData && flattenedData[activeReelIndex]?._id}
        />
      )}
    </div>
  );
};

export default ReelsContainer;