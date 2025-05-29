import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const AutoPlayVideo = ({ src, type = 'video/mp4', handleNavigation }: { src: string, type?: string, handleNavigation?: any }) => {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

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

  return (

    <video
      onClick={handleNavigation}
      onTouchEnd={handleNavigation}
      ref={videoRef}
      src={src}
      loop
      controls
      disablePictureInPicture
      controlsList="nodownload noplaybackrate"
      playsInline
      className={`w-full ${isVisible ? 'opacity-100' : 'opacity-50'} w-full max-h-[500px] h-full transition-opacity duration-300`}
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