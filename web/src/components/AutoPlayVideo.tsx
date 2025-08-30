import { useRef, useEffect, useState } from 'react';
import videoViewTracker from './Reel/VideoViewTracker';

const AutoPlayVideo = ({
  src,
  postId, 
  type = 'video/mp4',
  handleNavigation
}: {
  src: string;
  postId: string;
  handleNavigation: any;
  type?: string;
}) => {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const hasStartedTracking = useRef(false);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;

    return () => {
      isComponentMounted.current = false;
      if (postId && hasStartedTracking.current) {
        videoViewTracker.stopTracking(postId);
        hasStartedTracking.current = false;
      }
    };
  }, [postId]);

  const updatePlaybackState = (playing: boolean) => {
    setIsPlaying(playing);

    if (postId && hasStartedTracking.current) {
      videoViewTracker.updatePlaybackState(postId, playing);
    }
  };

  const startViewTracking = () => {
    if (!postId || hasStartedTracking.current) {
      return;
    }

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

          if (videoRef.current) {
            videoRef.current.play().then(() => {
              updatePlaybackState(true);
              startViewTracking();
            }).catch(err => {
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
  }, [postId]);

  const handlePlay = () => {
    updatePlaybackState(true);

    if (!hasStartedTracking.current) {
      startViewTracking();
    }
  };

  const handlePause = () => {
    updatePlaybackState(false);
  };

  const handleEnded = () => {
    updatePlaybackState(false);
  };

  const handleError = (e) => {
    updatePlaybackState(false);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
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
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
      e.preventDefault();
      e.stopPropagation();
      handleNavigation();
    }
  };

  const handleClick = (e) => {
    if (handleNavigation) {
      handleNavigation();
    } else {
      e.preventDefault();
      e.stopPropagation();
      togglePlayPause();
    }
  };

  return (
    <div className="relative">
      <video
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none'
        }}
      />

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