import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AutoPlayVideo = ({ src, type = 'video/mp4', handleNavigation }: { src: string, type?: string, handleNavigation?: any }) => {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });

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
          videoRef.current.play();
        } else {
          setIsVisible(false);
          videoRef.current.pause();
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
  }, []);

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

  return (
    <video
      onClick={handleNavigation} // For desktop/mouse
      onTouchStart={handleTouchStart} // Track touch start
      onTouchEnd={handleTouchEnd} // Smart touch end that avoids scroll conflicts
      ref={videoRef}
      src={src}
      loop
      controls
      disablePictureInPicture
      controlsList="nodownload noplaybackrate"
      playsInline
      className={`w-full ${isVisible ? 'opacity-100' : 'opacity-50'} w-full max-h-[500px] h-full transition-opacity duration-300`}
      style={{ 
        touchAction: 'manipulation', // Prevents double-tap zoom and improves touch response
        WebkitTouchCallout: 'none'   // Prevents long-press callout on iOS
      }}
    />
  );
};

export default AutoPlayVideo;
// import React, { useRef, useEffect, useState } from 'react';

// const TopmostVideoPlayer = ({ src, type = 'video/mp4' }) => {
//   const videoRef = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(false);

//   useEffect(() => {
//     const options = {
//       root: null,
//       rootMargin: '0px',
//       threshold: 1,
//     };

//     let currentlyPlayingVideo = null;

//     const findTopmostVisibleVideo = (entries) => {
//       let topmostVideo = null;
//       let topmostPosition = Infinity;

//       entries.forEach(entry => {
//         if (entry.isIntersecting && entry.intersectionRatio === 1) {
//           const position = entry.boundingClientRect.top;
//           if (position < topmostPosition) {
//             topmostPosition = position;
//             topmostVideo = entry.target;
//           }
//         }
//       });

//       return topmostVideo;
//     };

//     const observer = new IntersectionObserver((entries) => {
//       const topmostVideo = findTopmostVisibleVideo(entries);

//       if (topmostVideo) {
//         if (currentlyPlayingVideo && currentlyPlayingVideo !== topmostVideo) {
//           currentlyPlayingVideo.pause();
//         }
//         topmostVideo.play();
//         currentlyPlayingVideo = topmostVideo;
//         setIsPlaying(videoRef.current === topmostVideo);
//       } else {
//         if (currentlyPlayingVideo) {
//           currentlyPlayingVideo.pause();
//           currentlyPlayingVideo = null;
//         }
//         setIsPlaying(false);
//       }
//     }, options);

//     const videos = document.querySelectorAll('video');
//     videos.forEach(video => observer.observe(video));

//     return () => {
//       videos.forEach(video => observer.unobserve(video));
//     };
//   }, []);

//   return (
//     <div className="video-container">
//       <video
//         ref={videoRef}
//         src={src}
//         loop
//         playsInline
//         controls
//         className={`w-full max-h-[500px] h-full transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}
//       />
//     </div>
//   );
// };

// export default TopmostVideoPlayer;