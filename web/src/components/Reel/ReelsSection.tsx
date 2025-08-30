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
import EditReelBottomSheet from '@/models/EditReelSheet';



























































































const ReelsContainer: React.FC = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();


  const containerRef = useRef<HTMLDivElement>(null);
  const isComponentMounted = useRef(true);
  const prefetchingInProgressRef = useRef(false);
  const activeVideoRef = useRef<string | null>(null);
  const autoScrollTimeoutRef = useRef<number | NodeJS.Timeout | null>(null);
  const videoPlayStartTimeRef = useRef<number | null>(null);
  const hasVideoPlayedOnceRef = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const initialScrollPerformedRef = useRef(false);


  const [currentReelId, setCurrentReelId] = useState<string | null>(null);
  const [sharedReel, setSharedReel] = useState(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [prefetchedVideos, setPrefetchedVideos] = useState(new Set());


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



  const sourceMode = useMemo(() => {

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
      userId: location?.state?.userId,
      reelData: location.state?.reelData,
      profileType: location.state?.profileType,
      initialReelId: location.state?.initialReelId || params.reelId,
      isSuggested: location.state?.reelData?.isSuggested || false
    };
  }, [params, location.state]);



  const profileLikeMutation = useLikeProfileReelPost(user?._id);
  const profileBookmarkMutation = useBookmarkProfileReelPost(user?._id);

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


  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage
  } = useReelsDataSource(sourceMode, sourceParams);


  const updateReel = useUpdateReel()


  const flattenedData = useMemo(() => {
    return data || [];
  }, [data]);


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


  useEffect(() => {
    if (!flattenedData || flattenedData.length === 0 || isLoading || initialScrollPerformedRef.current) {
      return;
    }


    if (initialReelIndex > 0 && sourceParams.initialReelId && (sourceMode === 'profile' || sourceMode === 'bookmark' || sourceMode === 'bookmarks')) {
      console.log(`Scrolling directly to reel at index ${initialReelIndex} without smooth scrolling`);


      const targetElement = document.querySelector(`[data-index="${initialReelIndex}"]`);
      if (targetElement && containerRef.current) {

        targetElement.scrollIntoView({
          behavior: 'auto',
          block: 'start'
        });


        initialScrollPerformedRef.current = true;
      }
    }
  }, [flattenedData, initialReelIndex, sourceParams.initialReelId, sourceMode, isLoading]);


  const handleAutoScroll = useCallback((isFromLongPress = false) => {
    if (bottomSheetOpen) {
      console.log('Auto-scroll prevented: bottom sheet is open');
      return;
    }


    if (!isFromLongPress) {

      if (!autoScrollReels.autoScroll) {
        console.log('Auto-scroll disabled by settings');
        return;
      }
    } else {

      console.log('Auto-scrolling triggered by long press + video completion');
    }


    if (activeReelIndex >= flattenedData.length - 1) {
      console.log('Already at last video, not scrolling');
      return;
    }

    console.log('Auto-scrolling to next reel');


    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }


    const nextReelElement = document.querySelector(`[data-index="${activeReelIndex + 1}"]`);
    if (nextReelElement) {
      nextReelElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [autoScrollReels.autoScroll, activeReelIndex, flattenedData, bottomSheetOpen, sourceMode]);




  const startAutoScrollTimer = useCallback(() => {

    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }


    if (!autoScrollReels.autoScroll) return;


    if (bottomSheetOpen) {
      console.log('Auto-scroll timer not started: bottom sheet is open');
      return;
    }


    if (longPressActive) {
      console.log('Long press active: bypassing timer, will auto-scroll ONLY on video completion');
      return;
    }


    if (userInteracted) {
      console.log('User interacted with video, relying on video completion for auto-scroll');
      return;
    }


    if (autoScrollReels.autoScrollDelay === null) {
      console.log('Auto-scroll using video completion mode, not timer');
      return;
    }


    if (!autoScrollReels.autoScrollDelay || autoScrollReels.autoScrollDelay <= 0) {
      console.log('Invalid delay value:', autoScrollReels.autoScrollDelay);
      return;
    }


    const delayMs = autoScrollReels.autoScrollDelay * 1000;
    console.log(`Starting auto-scroll timer for ${delayMs}ms`);

    autoScrollTimeoutRef.current = setTimeout(() => {

      if (longPressActive) {
        console.log('Auto-scroll timer fired but long press is active - canceling');
        return;
      }

      handleAutoScroll(false);
    }, delayMs);

    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, [autoScrollReels, handleAutoScroll, bottomSheetOpen, longPressActive, userInteracted]);




  const updateVideoPlaybackState = useCallback((videoId, isPlaying) => {
    if (!videoId) return;

    console.log(`Updating playback state for video ${videoId}: ${isPlaying ? 'playing' : 'paused'}`);


    videoViewTracker.updatePlaybackState(videoId, isPlaying);


    if (isPlaying && !hasVideoPlayedOnceRef.current) {
      console.log('Video played for the first time, autoScroll:', autoScrollReels.autoScroll,
        'autoScrollDelay:', autoScrollReels.autoScrollDelay, 'longPressActive:', longPressActive,
        'userInteracted:', userInteracted);

      hasVideoPlayedOnceRef.current = true;
      videoPlayStartTimeRef.current = Date.now();


      if (autoScrollReels.autoScroll) {
        if (longPressActive) {

          console.log('Long press active: will auto-scroll ONLY on video completion (no timer)');

          if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
            autoScrollTimeoutRef.current = null;
          }
        } else if (userInteracted) {

          console.log('User interacted: ignoring delay, will auto-scroll ONLY on video completion');

          if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
            autoScrollTimeoutRef.current = null;
          }
        } else if (autoScrollReels.autoScrollDelay !== null && autoScrollReels.autoScrollDelay > 0) {

          console.log('Starting auto-scroll timer with delay:', autoScrollReels.autoScrollDelay);
          startAutoScrollTimer();
        } else {

          console.log('Auto-scroll on video completion mode');
        }
      }
    }
  }, [startAutoScrollTimer, autoScrollReels, longPressActive, userInteracted, sourceMode]);















































  useEffect(() => {
    if (!containerRef.current || !flattenedData?.length) return;


    observer.current = new IntersectionObserver((entries) => {

      requestAnimationFrame(() => {
        entries.forEach(entry => {
          const reelId = entry.target.getAttribute('data-reel-id');
          const reelIndex = parseInt(entry.target.getAttribute('data-index') || '0');


          if (entry.isIntersecting && reelId) {

            const isAlreadyActiveAndPlaying = reelIndex === activeReelIndex &&
              flattenedData[reelIndex] &&
              !VideoPlaybackManager.isVideoManuallyPaused(`reel-${flattenedData[reelIndex].id}`);

            if (!isAlreadyActiveAndPlaying) {
              console.log(`Video ${reelIndex} became active (was ${activeReelIndex})`);
              setActiveReelIndex(reelIndex);


              if (activeVideoRef.current) {
                videoViewTracker.updatePlaybackState(activeVideoRef.current, false);
                videoViewTracker.stopTracking(activeVideoRef.current);
                activeVideoRef.current = null;
              }


              const currentVideo = flattenedData[reelIndex];
              if (currentVideo?.id) {
                videoViewTracker.startTracking({
                  videoId: currentVideo.id,
                  type: 'video'
                });
                activeVideoRef.current = currentVideo.id;
              }


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


                hasVideoPlayedOnceRef.current = false;
                videoPlayStartTimeRef.current = null;
                setUserInteracted(false);
                setLongPressActive(false);


                if (autoScrollTimeoutRef.current) {
                  clearTimeout(autoScrollTimeoutRef.current);
                  autoScrollTimeoutRef.current = null;
                }


                setTimeout(() => prefetchVideosAround(reelIndex), 200);
              }
            }
          } else if (!entry.isIntersecting && reelIndex === activeReelIndex) {

            console.log(`Video ${reelIndex} went out of view`);


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
      threshold: [0.4, 0.6, 0.8],
      rootMargin: '-60px 0px -60px 0px'
    });


    const reelElements = containerRef.current.querySelectorAll('.reel-item');
    reelElements.forEach(el => {
      observer.current?.observe(el);
    });

    return () => {
      observer.current?.disconnect();
    };
  }, [flattenedData?.length, hasNextPage, fetchNextPage, sourceMode, activeReelIndex]);

  const prefetchVideosAround = useCallback((index, extraRange = 0) => {

    if (prefetchingInProgressRef.current || !flattenedData?.length) return;
    prefetchingInProgressRef.current = true;




    prefetchingInProgressRef.current = false;
  }, [flattenedData, prefetchedVideos]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {

        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
          autoScrollTimeoutRef.current = null;
        }


        VideoPlaybackManager.pauseCurrentlyPlaying();


        if (activeVideoRef.current) {
          videoViewTracker.stopTracking(activeVideoRef.current);
        }


        videoViewTracker.sendBatchToServer(true);
      } else {

        if (autoScrollReels.autoScroll && autoScrollReels.autoScrollDelay && hasVideoPlayedOnceRef.current) {
          startAutoScrollTimer();
        }


        if (isScreenFocused && flattenedData[activeReelIndex]) {
          const currentVideo = flattenedData[activeReelIndex];
          if (currentVideo) {
            const videoId = `reel-${currentVideo.id}`;


            VideoPlaybackManager.setCurrentlyPlaying(videoId, {
              force: true,
              prefetchAdjacent: true,
              videos: flattenedData,
              currentIndex: activeReelIndex
            });


            if (currentVideo.id) {
              videoViewTracker.startTracking({
                videoId: currentVideo.id,
                type: 'video'
              });

              activeVideoRef.current = currentVideo.id;
            }


            prefetchVideosAround(activeReelIndex);
          }
        }
      }
    };


    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScreenFocused, activeReelIndex, flattenedData, autoScrollReels, startAutoScrollTimer]);

































































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


      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freemochat-video-${flattenedData[activeReelIndex]._id}.mp4`;
      document.body.appendChild(a);
      a.click();


      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.info("Your download will begin shortly");

    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || "An error occurred while downloading the video");
    }
  };




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

      const isSuggested = !!reel.isSuggested;

      
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
        
        likeMutationHook = feedLikeMutation;
        bookmarkMutationHook = feedBookmarkMutation;
      }
      else {
        
        likeMutationHook = feedLikeMutation;
        bookmarkMutationHook = feedBookmarkMutation;
      }

      
      const normalizedReel = {
        ...reel,
        
        targetId: reel.targetId || (reel.target && reel.target._id) || '',
        
        type: reel.type || 'user',
        postType: reel.postType || 'post',
        
        likesCount: typeof reel.likesCount === 'number' ? reel.likesCount : 0,
        commentsCount: typeof reel.commentsCount === 'number' ? reel.commentsCount : 0,
        sharesCount: typeof reel.sharesCount === 'number' ? reel.sharesCount : 0,
        videoViewsCount: typeof reel.videoViewsCount === 'number' ? reel.videoViewsCount : 0,
        
        isLikedByUser: !!reel.isLikedByUser,
        isBookmarkedByUser: !!reel.isBookmarkedByUser,
        
        media: reel.media || [],
        
        target: reel.target || {},
        
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

  
  
  
  
  

  return (
    <div className='flex'>
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

      <div
        className="relative w-full bg-black overflow-hidden"
        style={{
          
          height: 'calc(100dvh)', 
          minHeight: 'calc(100vh)', 
          maxHeight: 'calc(100dvh)', 
        }}
      >
        <div
          ref={containerRef}
          className="w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory reels-scrollbar-hide"
          style={{
            height: '100%',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y', 
            overscrollBehavior: 'contain', 
          }}
        >
          <style>{`
            .reels-scrollbar-hide::-webkit-scrollbar {
              display: none;
          }`}</style>

          {renderReels}
        </div>

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

        {showAutoScrollControls && (
          <AutoScrollControls
            autoScrollSettings={autoScrollReels}
            onSettingsChange={setAutoScrollReels}
            isVisible={showAutoScrollControls}
            setIsVisible={setShowAutoScrollControls}
          />
        )}


        {isMobile && updateReelActive &&
          <EditReelBottomSheet
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
            isReel={true}
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
            isReel={true}
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