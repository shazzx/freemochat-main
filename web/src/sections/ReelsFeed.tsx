// // src/components/Reels/ReelsFeed.tsx
// import React, { useRef, useState, useEffect, useCallback } from 'react';
// // IMPORTANT: Use the correct hook for reels!
// import { useReelsFeed } from '@/hooks/Reels/useReels'; // Corrected Import
// import Reel from './Reel';
// import ScreenLoader from '@/components/ScreenLoader';
// import { useInView } from 'react-intersection-observer';
// import { throttle } from 'lodash'; // Import throttle (npm install lodash @types/lodash)
// import { useFeed } from '@/hooks/Post/usePost';
// // import { ReelsPage, ReelData } from '@/types'; // Import your defined types

// const SCROLL_THROTTLE_MS = 150; // Throttle time for scroll handler

// function ReelsFeed() {
//     // Use the CORRECT hook and provide the type for better inference
//     const {
//         data, // data will be of type InfiniteData<ReelsPage> | undefined
//         isLoading,
//         fetchNextPage,
//         hasNextPage,
//         isFetchingNextPage,
//         error // Handle potential errors
//     } = useFeed(); // Corrected Hook Usage

//     const containerRef = useRef<HTMLDivElement>(null);
//     const [activeReelFlatIndex, setActiveReelFlatIndex] = useState(0);

//     // --- Logic to find the active Reel (Throttled) ---
//     const handleScroll = useCallback(() => {
//         const container = containerRef.current;
//         if (!container || !data) return;

//         const reelElements = container.querySelectorAll<HTMLDivElement>('.reel-item-container');
//         if (reelElements.length === 0) return;

//         let minDiff = Infinity;
//         let currentActiveFlatIndex = 0;
//         const viewportCenterY = window.innerHeight / 2;

//         reelElements.forEach((reelEl, index) => {
//             const rect = reelEl.getBoundingClientRect();
//             // Ensure element has height before calculating center
//             if (rect.height === 0) return;

//             const reelCenterY = rect.top + rect.height / 2;
//             const diff = Math.abs(reelCenterY - viewportCenterY);

//             if (diff < minDiff) {
//                 minDiff = diff;
//                 currentActiveFlatIndex = index;
//             }
//         });

//         // Use functional update to avoid stale state issues if needed,
//         // though direct set is often fine here.
//         setActiveReelFlatIndex(currentActiveFlatIndex);

//     }, [data]); // Dependency: data (to know reelElements exist)

//     // Create the throttled version of the handler
//     const throttledScrollHandler = useRef(throttle(handleScroll, SCROLL_THROTTLE_MS)).current;

//     useEffect(() => {
//         const container = containerRef.current;
//         if (!container) return;

//         // Initial check
//         handleScroll();

//         container.addEventListener('scroll', throttledScrollHandler);

//         return () => {
//             container.removeEventListener('scroll', throttledScrollHandler);
//             throttledScrollHandler.cancel(); // Clean up Lodash throttle
//         };
//     }, [throttledScrollHandler, handleScroll]); // Re-attach if handler changes (it shouldn't often)


//     // --- Infinite Scroll Logic ---
//     const { ref: lastReelInViewRef, inView: isLastReelInView } = useInView({
//         threshold: 0.2,
//         triggerOnce: false,
//     });

//     useEffect(() => {
//         if (isLastReelInView && hasNextPage && !isFetchingNextPage) {
//             console.log('Fetching next page of reels...');
//             fetchNextPage();
//         }
//     }, [isLastReelInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

//     // Flatten reels data pages into a single array
//     // Use ?.pages to safely access pages
//     const allReels = data?.flatMap(page => page.posts) || [];

//     // --- UI Rendering ---
//     if (isLoading && allReels.length === 0) {
//         return <div className="w-full h-screen bg-black flex items-center justify-center"><ScreenLoader /></div>;
//     }

//     if (error) {
//          return <div className="w-full h-screen bg-black flex items-center justify-center text-red-500">Error loading reels. Please try again later.</div>;
//     }

//     if (!isLoading && allReels.length === 0) {
//          return (
//              <div className='w-full h-screen bg-black flex flex-col gap-8 items-center justify-center text-center text-muted-foreground'>
//                  {/* Empty state SVG */}
//                  <svg className='w-[60%] max-w-sm h-[50%]' viewBox="0 0 900 600" fill="none" xmlns="http://www.w3.org/2000/svg">...</svg>
//                  <span>No Reels here yet. Check back later!</span>
//              </div>
//          );
//     }

//     return (
//         <div
//             ref={containerRef}
//             className='w-full h-screen overflow-y-auto snap-y snap-mandatory bg-black flex flex-col items-center' // Added items-center for desktop centering
//         >
//             {allReels.map((reel, index) => {
//                 const isActive = index === activeReelFlatIndex;
//                 const isLastItem = index === allReels.length - 1;

//                 return (
//                     <Reel
//                         key={reel._id} // Use a stable key
//                         reelData={reel}
//                         isActive={isActive}
//                         ref={isLastItem ? lastReelInViewRef : null}
//                     />
//                 );
//             })}

//             {isFetchingNextPage && (
//                 <div className="w-full flex justify-center py-4 my-4">
//                     <ScreenLoader />
//                 </div>
//             )}
//             {/* Add a bit of padding at the bottom maybe? */}
//              {/* <div className="h-16"></div> */}
//         </div>
//     );
// }

// export default ReelsFeed;