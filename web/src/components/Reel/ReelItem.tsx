// ReelItem.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import VideoPlaybackManager from './VideoPlaybackManager';
import videoViewTracker from './VideoViewTracker';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { UseMutationResult } from '@tanstack/react-query';


interface ReelItemProps {
  reel: any;
  isActive: boolean;
  pageIndex: number;
  reelIndex: number;
  index: number;
  handleCommentsOpen: (reelId: string) => void;
  handleShareOpen: (reel: any) => void;
  handleOptionsOpen: (reelId: string) => void;
  onPlaybackStateChange: (videoId: string, isPlaying: boolean) => void;
  onVideoComplete: (isFromLongPress: boolean) => void;
  autoScrollEnabled: boolean;
  onUserInteraction: () => void;
  onLongPressStateChange: (isActive: boolean, videoId: string) => void;
  useLikeReel: UseMutationResult;
  useBookmarkReel: UseMutationResult;
  className?: string;
}

const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  isActive,
  pageIndex,
  reelIndex,
  index,
  handleCommentsOpen,
  handleShareOpen,
  handleOptionsOpen,
  onPlaybackStateChange,
  onVideoComplete,
  autoScrollEnabled,
  onUserInteraction,
  onLongPressStateChange,
  useLikeReel,
  useBookmarkReel,
  className,
  ...props
}) => {

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const isComponentMounted = useRef(true);
  const lastTapTime = useRef(0);
  const lastDoubleTapTime = useRef(0);
  const hasEverBeenActive = useRef(false);
  const hasCompletedRef = useRef(false);
  const manuallyPaused = useRef(false);
  const longPressTimeout = useRef<number | null>(null);
  const isLongPressActiveRef = useRef(false);

  // Generate a unique ID for this reel
  const reelInstanceId = useMemo(() => `reel-${reel._id}`, [reel._id]);

  const likeMutation = useLikeReel;
  const bookmarkMutation = useBookmarkReel;

  // State
  const [videoState, setVideoState] = useState({
    isLoading: true,
    isBuffering: false,
    isPlaying: false,
    isPaused: false,
    isMuted: false,
    error: false,
    progress: 0,
    duration: 0,
    position: 0,
  });

  const [uiState, setUiState] = useState({
    showControls: false,
    showLikeAnimation: false,
    doubleTapCoordinates: { x: 0, y: 0 }
  });

  const [contentExpanded, setContentExpanded] = useState(false);

  // Mutations for interactions

  // Normalize reel data
  const memoizedReel = useMemo(() => ({
    _id: reel._id,
    mediaUrl: reel?.media?.[0]?.url || '',
    authorId: typeof reel.user === 'string' ? reel.user : (reel?.user?._id || reel?.target?._id || ''),
    isLiked: !!reel.isLikedByUser,
    isBookmarked: !!reel.isBookmarkedByUser,
    likesCount: reel.likesCount || 0,
    commentsCount: reel.commentsCount || 0,
    sharesCount: reel.sharesCount || 0,
    videoViewsCount: reel.videoViewsCount || 0,
    type: reel.type || 'user',
    postType: reel.postType || 'reel',
    targetId: reel.targetId,
    createdAt: reel.createdAt,
    content: reel.content || '',
    target: reel.target || {}
  }), [
    // PERFORMANCE: Only depend on specific properties that actually matter
    reel._id,
    reel.media?.[0]?.url,
    reel.isLikedByUser,
    reel.isBookmarkedByUser,
    reel.likesCount,
    reel.commentsCount,
    reel.sharesCount,
    reel.videoViewsCount,
    reel.targetId,
    reel.content
  ]);

  // Register video with VideoPlaybackManager
  useEffect(() => {
    if (!videoRef.current) return;

    // Register video ref with manager
    const unregister = VideoPlaybackManager.registerVideo(reelInstanceId, videoRef);

    // Mark as visible
    VideoPlaybackManager.setVideoVisible(reelInstanceId, true, {
      uri: memoizedReel.mediaUrl,
      index: index,
      isCached: false
    });

    return () => {
      unregister();
      VideoPlaybackManager.setVideoVisible(reelInstanceId, false);
    };
  }, [reelInstanceId, memoizedReel.mediaUrl, index]);

  // Video metadata loading
  const handleVideoMetadata = useCallback(() => {
    if (!videoRef.current) return;

    setVideoState(prev => ({
      ...prev,
      duration: videoRef.current?.duration || 0,
      isLoading: false,
    }));

    // If this is the active video and not manually paused, play it
    if (isActive && !manuallyPaused.current) {
      videoRef.current.play().catch(err => console.log('Error auto-playing video:', err));
    }
  }, [isActive]);

  // REPLACE THESE FUNCTIONS in ReelItem.tsx:

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !isActive) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const progress = duration ? currentTime / duration : 0;

    // PERFORMANCE: Only update state if there's a meaningful change
    setVideoState(prev => {
      const newPosition = currentTime * 1000;
      const positionDiff = Math.abs(newPosition - prev.position);

      // Only update if position changed by more than 100ms or progress changed significantly
      if (positionDiff > 100 || Math.abs(progress - prev.progress) > 0.01) {
        return {
          ...prev,
          position: newPosition,
          progress: progress
        };
      }
      return prev;
    });

    // Check for video completion (using onEnded is more reliable, but keep this as backup)
    if (progress > 0.99 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      console.log('Video completed via timeUpdate. AutoScrollEnabled:', autoScrollEnabled);

      // Handle auto-scroll if enabled and video completed
      if (autoScrollEnabled && onVideoComplete) {
        if (isLongPressActiveRef.current) {
          console.log('Video completed during long press, triggering auto-scroll');
          onVideoComplete(true);
        } else {
          console.log('Video completed, triggering auto-scroll');
          onVideoComplete(false);
        }
      }
      // Note: Looping is now handled in onEnded for better reliability
    }
  }, [isActive, autoScrollEnabled, onVideoComplete]);
  // Handle context menu (right-click) to support desktop long press



  // REPLACE the long press handling functions in ReelItem.tsx (around line 160)
  // WITH these improved versions:

  // Handle long press start - FIXED for both mobile and desktop
  const handleLongPressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    // Clear any existing timeout
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    console.log('Long press start detected');

    longPressTimeout.current = window.setTimeout(() => {
      if (!isLongPressActiveRef.current) {
        isLongPressActiveRef.current = true;

        // If video is paused, play it
        if (!videoState.isPlaying && videoRef.current) {
          manuallyPaused.current = false;
          VideoPlaybackManager.clearManualPauseState(reelInstanceId);
          videoRef.current.play().catch(err => console.log('Error playing video on long press:', err));
        }

        // Notify parent component about long press
        onLongPressStateChange(true, memoizedReel._id);

        console.log('Long press activated on video:', memoizedReel._id);
      }
    }, 500) as unknown as number;
  }, [memoizedReel._id, videoState.isPlaying, onLongPressStateChange, reelInstanceId]);

  // Handle long press end - FIXED
  const handleLongPressEnd = useCallback(() => {
    // Clear timeout if still pending
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    // If long press was active, deactivate it
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;

      // Notify parent component about long press end
      onLongPressStateChange(false, memoizedReel._id);

      console.log('Long press deactivated on video:', memoizedReel._id);
    }
  }, [memoizedReel._id, onLongPressStateChange]);

  // FIXED: Enhanced context menu handling for desktop right-click long press simulation
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu

    // For desktop, simulate long press with right-click
    if (!isLongPressActiveRef.current) {
      console.log('Desktop right-click long press simulation');

      // Immediately activate long press (no delay for right-click)
      isLongPressActiveRef.current = true;

      // If video is paused, play it
      if (!videoState.isPlaying && videoRef.current) {
        manuallyPaused.current = false;
        VideoPlaybackManager.clearManualPauseState(reelInstanceId);
        videoRef.current.play().catch(err => console.log('Error playing video on right-click:', err));
      }

      // Notify parent component
      onLongPressStateChange(true, memoizedReel._id);

      // Auto-deactivate after 3 seconds (or until video ends)
      setTimeout(() => {
        if (isLongPressActiveRef.current) {
          isLongPressActiveRef.current = false;
          onLongPressStateChange(false, memoizedReel._id);
          console.log('Desktop long press auto-deactivated');
        }
      }, 3000);
    }
  }, [videoState.isPlaying, onLongPressStateChange, memoizedReel._id, reelInstanceId]);

  // REPLACE the handleVideoClick function in ReelItem.tsx (around line 250)
  // WITH this improved version that handles single tap for "play till end":

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    const videoId = `reel-${memoizedReel._id}`;

    if (videoState.isPlaying) {
      // Pausing
      videoRef.current.pause();
      manuallyPaused.current = true;
      VideoPlaybackManager.notifyVideoPaused(videoId);
      console.log(`User manually paused video: ${videoId}`);
    } else {
      // Playing
      manuallyPaused.current = false;
      VideoPlaybackManager.clearManualPauseState(videoId);
      videoRef.current.play().catch(err => {
        console.log('Error playing video:', err);

        // Handle autoplay restrictions
        if (err.name === 'NotAllowedError') {
          videoRef.current!.muted = true;
          setVideoState(prev => ({ ...prev, isMuted: true }));
          videoRef.current!.play().catch(e => console.log('Muted playback failed:', e));
        }
      });
      console.log(`User manually started video: ${videoId}`);
    }
  }, [videoState.isPlaying, memoizedReel._id]);

  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const { clientX, clientY } = e;

    // Check for double tap (like)
    if (now - lastTapTime.current < 300) {
      // Prevent duplicate double taps
      if (now - lastDoubleTapTime.current > 1000) {
        lastDoubleTapTime.current = now;

        // Like the reel if not already liked
        if (!memoizedReel.isLiked) {
          likeMutation.mutate({
            postId: memoizedReel._id,
            pageIndex,
            postIndex: reelIndex,
            targetId: memoizedReel.targetId,
            authorId: memoizedReel.authorId,
            type: memoizedReel.type,
          });
        }

        // Show heart animation
        setUiState(prev => ({
          ...prev,
          showLikeAnimation: true,
          doubleTapCoordinates: { x: clientX, y: clientY }
        }));

        // Hide animation after 1 second
        setTimeout(() => {
          if (isComponentMounted.current) {
            setUiState(prev => ({ ...prev, showLikeAnimation: false }));
          }
        }, 1000);
      }
    } else {
      // Single tap - toggle controls and play/pause
      setUiState(prev => ({ ...prev, showControls: !prev.showControls }));

      // Toggle play/pause
      togglePlayPause();

      // FIXED: Notify parent that user has interacted (this enables "play till end" mode)
      onUserInteraction();
      console.log('Single tap detected - enabled play till end mode');

      // Auto-hide controls after 3 seconds if they're now showing
      if (!uiState.showControls) {
        setTimeout(() => {
          if (isComponentMounted.current) {
            setUiState(prev => ({ ...prev, showControls: false }));
          }
        }, 3000);
      }
    }

    lastTapTime.current = now;
  }, [likeMutation, pageIndex, reelIndex, memoizedReel, togglePlayPause, uiState.showControls, onUserInteraction]);

  // Video play/pause state changes
  const handlePlayPause = useCallback((isPlaying: boolean) => {
    setVideoState(prev => ({
      ...prev,
      isPlaying,
      isPaused: !isPlaying
    }));

    // Update tracker and notify parent
    if (isActive) {
      onPlaybackStateChange(memoizedReel._id, isPlaying);
    }
  }, [isActive, memoizedReel._id, onPlaybackStateChange]);

  // Video play event handler
  const handlePlay = useCallback(() => {
    handlePlayPause(true);
  }, [handlePlayPause]);

  // Video pause event handler
  const handlePause = useCallback(() => {
    handlePlayPause(false);
  }, [handlePlayPause]);


  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;

    const newMuteState = !videoState.isMuted;
    videoRef.current.muted = newMuteState;

    setVideoState(prev => ({
      ...prev,
      isMuted: newMuteState
    }));
  }, [videoState.isMuted]);

  const skipBackward = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const newTime = Math.max(0, currentTime - 5); // Don't go below 0
    videoRef.current.currentTime = newTime;

    // Update state immediately for smooth UI feedback
    setVideoState(prev => ({
      ...prev,
      position: newTime * 1000,
      progress: videoState.duration ? newTime / videoState.duration : 0
    }));

    // Auto-play the video after seeking
    if (videoRef.current.paused) {
      manuallyPaused.current = false;
      videoRef.current.play().catch(err => console.log('Error auto-playing after backward skip:', err));
    }
  }, [videoState.duration]);

  // Skip forward 5 seconds
  const skipForward = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const newTime = Math.min(duration, currentTime + 5); // Don't exceed video duration
    videoRef.current.currentTime = newTime;

    // Update state immediately for smooth UI feedback
    setVideoState(prev => ({
      ...prev,
      position: newTime * 1000,
      progress: duration ? newTime / duration : 0
    }));

    // Auto-play the video after seeking
    if (videoRef.current.paused) {
      manuallyPaused.current = false;
      videoRef.current.play().catch(err => console.log('Error auto-playing after forward skip:', err));
    }
  }, []);


  // Handle like action
  const handleLike = useCallback(() => {

    likeMutation.mutate({
      postId: memoizedReel._id,
      pageIndex,
      postIndex: reelIndex,
      targetId: memoizedReel.targetId,
      authorId: memoizedReel.authorId,
      type: memoizedReel.type,
      postType: memoizedReel.postType
    });
  }, [likeMutation, pageIndex, reelIndex, memoizedReel]);

  // Handle bookmark action
  const handleBookmark = useCallback(() => {
    bookmarkMutation.mutate({
      postId: memoizedReel._id,
      pageIndex,
      postIndex: reelIndex,
      targetId: memoizedReel.targetId,
      type: memoizedReel.type,
      postType: memoizedReel.postType
    });
  }, [bookmarkMutation, pageIndex, reelIndex, memoizedReel]);


  // REPLACE the video playback control useEffect in ReelItem.tsx (around line 380)
  // FROM the existing useEffect that handles isActive
  // TO this improved version:

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      hasEverBeenActive.current = true;

      // Reset completion flag when becoming active
      hasCompletedRef.current = false;

      // FIXED: Only play if not manually paused AND the video manager allows it
      const videoId = `reel-${memoizedReel._id}`;
      const isManuallyPaused = VideoPlaybackManager.isVideoManuallyPaused(videoId);

      if (!isManuallyPaused && !manuallyPaused.current) {
        console.log(`Starting playback for active video: ${videoId}`);
        videoRef.current.play().catch(err => {
          console.log('Error playing active video:', err);

          // Handle autoplay policy - try muted playback
          if (err.name === 'NotAllowedError') {
            console.log('Attempting muted playback due to autoplay policy');
            videoRef.current!.muted = true;
            setVideoState(prev => ({ ...prev, isMuted: true }));
            videoRef.current!.play().catch(e => console.log('Even muted playback failed:', e));
          }
        });
      } else {
        console.log(`Video ${videoId} is manually paused, not auto-playing`);
      }
    } else {
      // FIXED: When not active, always pause and mark as manually paused if it was playing
      if (videoRef.current && !videoRef.current.paused) {
        console.log(`Pausing video ${memoizedReel._id} - no longer active`);
        videoRef.current.pause();

        // If it was playing, this counts as a manual pause to prevent auto-resume
        const videoId = `reel-${memoizedReel._id}`;
        VideoPlaybackManager.notifyVideoPaused(videoId);
      }

      // Reset manual pause state when scrolling away (for next time it becomes active)
      manuallyPaused.current = false;
    }
  }, [isActive, memoizedReel._id]);

  // REPLACE the togglePlayPause function in ReelItem.tsx
  // TO this improved version:


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      hasCompletedRef.current = false;
      isLongPressActiveRef.current = false;

      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }

      // Update view tracker
      if (memoizedReel._id) {
        videoViewTracker.updatePlaybackState(memoizedReel._id, false);
      }
    };
  }, [memoizedReel._id]);

  // Derived display data
  const displayData = useMemo(() => ({
    progressBarWidth: `${videoState.progress * 100}%`,
    username: memoizedReel.type === "user"
      ? `${memoizedReel.target?.firstname || ''} ${memoizedReel.target?.lastname || ''}`
      : memoizedReel.target?.name || 'User',
    formattedDate: format(new Date(memoizedReel.createdAt), 'MMM d'),
    shouldShowControls: uiState.showControls,
    playIconName: videoState.isPlaying ? "pause" : "play",
    muteIconName: videoState.isMuted ? "volume-x" : "volume-2"
  }), [
    videoState.progress,
    videoState.isPlaying,
    videoState.isMuted,
    uiState.showControls,
    memoizedReel.type,
    memoizedReel.target,
    memoizedReel.createdAt,
  ]);

  return (
    <div
      className={`relative bg-black ${className}`}
      {...props}
    >
      {/* Video container */}

      <div
        className="relative w-full h-full flex items-center justify-center"
        onMouseDown={handleLongPressStart}  // Desktop long press start
        onMouseUp={handleLongPressEnd}      // Desktop long press end
        onMouseLeave={handleLongPressEnd}   // Desktop - end if mouse leaves
        onTouchStart={handleLongPressStart} // Mobile long press start
        onTouchEnd={handleLongPressEnd}     // Mobile long press end
        onTouchCancel={handleLongPressEnd}  // Mobile - end if touch is canceled
        onContextMenu={handleContextMenu}   // Desktop right-click simulation
        onClick={handleVideoClick}          // Single/double tap handling
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={memoizedReel.mediaUrl}
          className="h-full w-full object-contain"
          playsInline
          loop={false}
          preload="metadata"
          onLoadedMetadata={handleVideoMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={() => {
            console.log('Video ended event fired');
            hasCompletedRef.current = true;

            // FIXED: Handle auto-scroll with proper long press detection
            if (autoScrollEnabled && onVideoComplete) {
              if (isLongPressActiveRef.current) {
                console.log('Video ended during long press, triggering auto-scroll');
                // End the long press state since video completed
                isLongPressActiveRef.current = false;
                onLongPressStateChange(false, memoizedReel._id);
                onVideoComplete(true);
              } else {
                console.log('Video ended, triggering auto-scroll');
                onVideoComplete(false);
              }
            } else {
              // Loop the video if auto-scroll is disabled
              console.log('Video ended, looping since auto-scroll is disabled');
              if (isActive && !manuallyPaused.current) {
                requestAnimationFrame(() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    hasCompletedRef.current = false;
                    videoRef.current.play().catch(err => {
                      console.log('Error looping video on ended:', err);
                      if (err.name === 'NotAllowedError') {
                        videoRef.current!.muted = true;
                        setVideoState(prev => ({ ...prev, isMuted: true }));
                        videoRef.current!.play().catch(e => console.log('Muted loop failed:', e));
                      }
                    });
                  }
                });
              }
            }
          }}
          onError={() => setVideoState(prev => ({ ...prev, error: true, isLoading: false }))}
        />

        {/* Loading overlay */}
        {videoState.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {/* Buffering indicator */}
        {videoState.isBuffering && videoState.isPlaying && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-3 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          </div>
        )}

        {/* Error overlay */}
        {videoState.error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white text-lg mb-4">Failed to load video</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.reload();
              }}
              className="px-4 py-2 bg-pink-600 rounded-lg text-white font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Heart animation on double tap */}
        {uiState.showLikeAnimation && (
          <div
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 animate-scale-up"
            style={{
              left: uiState.doubleTapCoordinates.x,
              top: uiState.doubleTapCoordinates.y
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600/50 z-10">
          <div
            className="h-full bg-pink-600"
            style={{ width: displayData.progressBarWidth }}
          />
        </div>

        {/* Playback controls (when visible) */}
        {uiState.showControls && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <div className="flex items-center space-x-8">
              {/* Rewind button */}
              <button
                className="p-3 bg-black/60 rounded-full flex flex-col items-center"
                onClick={skipBackward}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8L12.066 11.2zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8L4.066 11.2z" />
                </svg>
                <span className="text-xs text-white mt-1">5s</span>
              </button>

              {/* Play/Pause button */}
              <button className="p-4 bg-black/60 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={videoState.isPlaying
                      ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    }
                  />
                </svg>
              </button>

              {/* Forward button */}
              <button
                className="p-3 bg-black/60 rounded-full flex flex-col items-center"
                onClick={skipForward}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
                <span className="text-xs text-white mt-1">5s</span>
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Bottom gradient for text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Right side action buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-20">
        {/* Like button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-8 w-8 ${memoizedReel.isLiked ? 'text-pink-600 fill-current' : 'text-white'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-white text-xs mt-1">{memoizedReel.likesCount}</span>
        </button>

        {/* Comment button */}
        <button
          onClick={() => handleCommentsOpen(memoizedReel._id)}
          className="flex flex-col items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-white text-xs mt-1">{memoizedReel.commentsCount}</span>
        </button>

        {/* Share button */}
        <button
          onClick={() => handleShareOpen(memoizedReel)}
          className="flex flex-col items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-white text-xs mt-1">{memoizedReel.sharesCount}</span>
        </button>

        {/* Views counter */}
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-white text-xs mt-1">{memoizedReel.videoViewsCount}</span>
        </div>

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          className="flex flex-col items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-7 w-7 ${memoizedReel.isBookmarked ? 'text-yellow-400 fill-current' : 'text-white'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Mute/unmute button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="p-2 bg-black/40 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={videoState.isMuted
                ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              }
            />
          </svg>
        </button>

        {/* Options button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOptionsOpen(memoizedReel._id);
          }}
          className="p-2 bg-black/40 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* User info and caption */}
      <div className="absolute bottom-8 left-4 right-20 z-20">
        {/* User row */}
        <div className="flex items-center mb-3">
          <Avatar className="">
            <AvatarImage src={memoizedReel.target?.profile} alt="Avatar" />
            <AvatarFallback>{displayData.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="text-white font-semibold">{displayData.username}</h3>
            <p className="text-gray-300 text-xs">{displayData.formattedDate}</p>
          </div>
        </div>

        {/* Caption */}
        {memoizedReel.content && (
          <div className="mt-2">
            <p className={`text-white ${contentExpanded ? '' : 'line-clamp-2'}`}>
              {memoizedReel.content}
            </p>

            {memoizedReel.content.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContentExpanded(!contentExpanded);
                }}
                className="text-gray-300 text-sm font-medium mt-1"
              >
                {contentExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default ReelItem;