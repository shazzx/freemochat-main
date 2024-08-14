// import { useState, useEffect, useRef } from 'react';

// const Story = ({ content }) => {
//   return (
//     <div style={{ width: '100%', height: '100%' }}>
//       {typeof content === 'string' ? (
//         <img src={content} alt="Story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//       ) : (
//         content
//       )}
//     </div>
//   );
// };

// const ProgressBar = ({ progress }) => {
//   return (
//     <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
//       <div
//         style={{
//           width: `${progress}%`,
//           height: '100%',
//           backgroundColor: 'white',
//           transition: 'width 0.1s linear',
//         }}
//       />
//     </div>
//   );
// };

// const CustomStories = ({ stories, storyDuration = 5000 }) => {
//   const [currentStory, setCurrentStory] = useState(0);
//   const [progress, setProgress] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);
//   const intervalRef = useRef(null);
//   const pausedTimeRef = useRef(0);
//   const startTimeRef = useRef(0);

//   useEffect(() => {
//     startProgress();
//     return () => clearInterval(intervalRef.current);
//   }, [currentStory]);

//   useEffect(() => {
//     if (!isPaused) {
//       startProgress();
//     } else {
//       clearInterval(intervalRef.current);
//     }
//   }, [isPaused]);

//   const startProgress = () => {
//     clearInterval(intervalRef.current);
//     startTimeRef.current = Date.now() - pausedTimeRef.current;
//     intervalRef.current = setInterval(() => {
//       const elapsedTime = Date.now() - startTimeRef.current;
//       const newProgress = (elapsedTime / storyDuration) * 100;

//       if (newProgress >= 100) {
//         clearInterval(intervalRef.current);
//         goToNextStory();
//       } else {
//         setProgress(newProgress);
//       }
//     }, 16);
//   };

//   const goToNextStory = () => {
//     setCurrentStory((prevStory) => (prevStory + 1) % stories.length);
//     setProgress(0);
//     pausedTimeRef.current = 0;
//   };

//   const goToPrevStory = () => {
//     setCurrentStory((prevStory) => (prevStory - 1 + stories.length) % stories.length);
//     setProgress(0);
//     pausedTimeRef.current = 0;
//   };

//   const handleMouseDown = () => {
//     setIsPaused(true);
//     clearInterval(intervalRef.current);
//     pausedTimeRef.current = Date.now() - startTimeRef.current;
//   };

//   const handleMouseUp = () => {
//     setIsPaused(false);
//   };

//   return (
//     <div
//       style={{ width: '360px', height: '640px', position: 'relative' }}
//       onMouseDown={handleMouseDown}
//       onMouseUp={handleMouseUp}
//       onTouchStart={handleMouseDown}
//       onTouchEnd={handleMouseUp}
//     >
//       <Story content={stories[currentStory].url} />
//       <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
//         <ProgressBar progress={progress} />
//       </div>
//       <div
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           display: 'flex',
//         }}
//       >
//         <div style={{ flex: 1 }} onClick={goToPrevStory} />
//         <div style={{ flex: 1 }} onClick={goToNextStory} />
//       </div>
//     </div>
//   );
// };

// export default CustomStories;