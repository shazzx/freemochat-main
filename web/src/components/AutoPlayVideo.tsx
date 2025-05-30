import { useRef, useEffect, useState } from 'react';
import videoViewTracker from './Reel/VideoViewTracker';

const AutoPlayVideo = ({
  src,
  postId, // Required prop for tracking this specific video
  // ❌ REMOVED: userId prop - not needed since MainHome sets it globally
  type = 'video/mp4',
  handleNavigation
}: {
  src: string;
  postId: string; // Unique identifier for this video
  // userId?: string; // ❌ REMOVED - MainHome handles this
  type?: string;
  handleNavigation?: any;
}) => {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const hasStartedTracking = useRef(false);
  const isComponentMounted = useRef(true);

  // ✅ SIMPLIFIED: Only cleanup on unmount, no user dependency
  useEffect(() => {
    isComponentMounted.current = true;

    return () => {
      isComponentMounted.current = false;

      // Stop tracking this video when component unmounts
      if (postId && hasStartedTracking.current) {
        console.log(`AutoPlayVideo: Stopping tracking for video ${postId} on unmount`);
        videoViewTracker.stopTracking(postId);
        hasStartedTracking.current = false;
      }
    };
  }, [postId]); // ❌ REMOVED: userId dependency

  // ✅ SIMPLIFIED: Handle playback state changes
  const updatePlaybackState = (playing: boolean) => {
    setIsPlaying(playing);

    // ✅ SIMPLIFIED: Only check if we have postId and started tracking
    // MainHome already set userId globally, so VideoViewTracker knows the user
    if (postId && hasStartedTracking.current) {
      console.log(`AutoPlayVideo: Updating playback state for ${postId}: ${playing ? 'playing' : 'paused'}`);
      videoViewTracker.updatePlaybackState(postId, playing);
    }
  };

  // ✅ SIMPLIFIED: Start tracking when video becomes visible and plays
  const startViewTracking = () => {
    // ✅ SIMPLIFIED: Only check postId and if not already tracking
    // VideoViewTracker already has userId from MainHome
    if (!postId || hasStartedTracking.current) {
      return;
    }

    console.log(`AutoPlayVideo: Starting view tracking for video ${postId}`);
    const trackingStarted = videoViewTracker.startTracking({
      videoId: postId,
      type: 'video'
    });

    if (trackingStarted) {
      hasStartedTracking.current = true;
    }
  };

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          // Start video playback
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              // Video started playing successfully
              updatePlaybackState(true);

              // Start view tracking when video actually starts playing
              startViewTracking();
            }).catch(err => {
              console.log('AutoPlayVideo: Error playing video:', err);

              // Try muted playback for autoplay restrictions
              if (err.name === 'NotAllowedError' && videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().then(() => {
                  updatePlaybackState(true);
                  startViewTracking();
                }).catch(e => {
                  console.log('AutoPlayVideo: Muted playback also failed:', e);
                });
              }
            });
          }
        } else {
          setIsVisible(false);

          // Pause video when not visible
          if (videoRef.current) {
            videoRef.current.pause();
            updatePlaybackState(false);
          }
        }
      });
    }, options);

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [postId]); // ❌ REMOVED: userId dependency

  // Handle video events
  const handlePlay = () => {
    updatePlaybackState(true);

    // Start tracking if not already started
    if (!hasStartedTracking.current) {
      startViewTracking();
    }
  };

  const handlePause = () => {
    updatePlaybackState(false);
  };

  const handleEnded = () => {
    updatePlaybackState(false);
    console.log(`AutoPlayVideo: Video ${postId} ended`);
  };

  const handleError = (e) => {
    console.error(`AutoPlayVideo: Error loading video ${postId}:`, e);
    updatePlaybackState(false);
  };

  // Handle manual play/pause toggle
  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.log('AutoPlayVideo: Error playing video manually:', err);

        // Try muted playback
        if (err.name === 'NotAllowedError') {
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => {
            console.log('AutoPlayVideo: Manual muted playback failed:', e);
          });
        }
      });
    }
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartTime.current = Date.now();
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  const handleTouchEnd = (e) => {
    if (!handleNavigation) return;

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;

    // Get final touch position
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Consider it a tap if:
    // 1. Touch duration is less than 300ms (quick tap)
    // 2. Movement is less than 10px in any direction (not a scroll)
    if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
      e.preventDefault();
      e.stopPropagation();
      handleNavigation();
    }
  };

  const handleClick = (e) => {
    // Check if it's a navigation click
    if (handleNavigation) {
      handleNavigation();
    } else {
      // Toggle play/pause if no navigation handler
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
    }
  };

  return (
    <div className="relative">
      <video
        onClick={handleClick} // For desktop/mouse
        onTouchStart={handleTouchStart} // Track touch start
        onTouchEnd={handleTouchEnd} // Smart touch end that avoids scroll conflicts
        ref={videoRef}
        src={src}
        loop
        controls
        disablePictureInPicture
        controlsList="nodownload noplaybackrate"
        playsInline
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        className={`w-full ${isVisible ? 'opacity-100' : 'opacity-50'} w-full max-h-[500px] h-full transition-opacity duration-300`}
        style={{
          touchAction: 'manipulation', // Prevents double-tap zoom and improves touch response
          WebkitTouchCallout: 'none'   // Prevents long-press callout on iOS
        }}
      />

      {/* Play/Pause indicator overlay */}
      {!isPlaying && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
          <div className="bg-black bg-opacity-60 rounded-full p-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* ✅ OPTIONAL: Re-enable debug info if needed */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Video ID: {postId}</div>
          <div>Visible: {isVisible ? 'Yes' : 'No'}</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
          <div>Tracking: {hasStartedTracking.current ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default AutoPlayVideo;