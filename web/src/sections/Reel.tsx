// src/components/Reels/Reel.tsx
import React, { useRef, useState, useEffect, forwardRef } from 'react';
import VideoPlayer from './VideoPlayer';
import ReelOverlayUI from './ReelOverlayUI';
import { useLikeReel, useBookmarkReel } from '@/hooks/Reels/useReels'; // Import your reel hooks
import ShareModel from '@/models/ShareModel'; // Reuse ShareModel
import BottomComments from '@/models/BottomComments'; // Reuse BottomComments
import LikesModel from '@/models/LikesModel'; // Reuse LikesModel
import ReportModel from '@/models/ReportModel'; // Reuse ReportModel
// Import your DropdownMenu logic/component for the 3 dots
import { cn } from '@/lib/utils'; // Assuming you have a utility for merging class names

interface ReelProps {
    reelData: any; // Use the ReelData interface
    isActive: boolean; // Passed from ReelsFeed
    // We'll use forwardRef to pass the ref from ReelsFeed directly to the root div
}

// Use forwardRef to receive the ref from the parent (ReelsFeed)
const Reel = forwardRef<HTMLDivElement, ReelProps>(({ reelData, isActive }, ref) => {
    const [isPlaying, setIsPlaying] = useState(isActive);
    const [isMuted, setIsMuted] = useState(true); // Start muted by default is common

    // State for modals
    const [showShareModal, setShowShareModal] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    // State for the 3-dots dropdown/modal

    // Reuse or adapt mutation hooks for Reels
    const likeMutation = useLikeReel(['reelsFeed']); // Pass appropriate query key
    const bookmarkMutation = useBookmarkReel(['reelsFeed']); // Pass appropriate query key

    useEffect(() => {
        // Only set isPlaying if the active state changes
        // This prevents issues if the user manually pauses a video but it stays active
        if (isActive) {
             setIsPlaying(true);
        } else {
             setIsPlaying(false);
             // Optionally reset video position or unload video for performance
        }
    }, [isActive]);

    const handleTogglePlayPause = () => {
        setIsPlaying(prev => !prev);
    };

    const handleToggleMute = () => {
        setIsMuted(prev => !prev);
    };

    const handleLikeClick = () => {
        likeMutation.mutate({ reelId: reelData._id /* add other necessary params */ });
        // Optimistically update local state if needed:
        // setReelData(prev => ({ ...prev, isLikedByUser: !prev.isLikedByUser, likesCount: prev.likesCount + (prev.isLikedByUser ? -1 : 1) }));
    };

    const handleBookmarkClick = () => {
        bookmarkMutation.mutate({ reelId: reelData._id /* add other necessary params */ });
         // Optimistically update local state if needed
    };

    const handleCommentClick = () => {
        setShowCommentsModal(true);
    };

     const handleShareClick = () => {
        setShowShareModal(true);
    };

    const handleDotsClick = () => {
        // Open the 3-dots menu/modal
        console.log("3 dots clicked for reel:", reelData._id);
        // Example: setShowReelMenu(true);
    };

    // Double tap to like on the video area
    const handleDoubleClick = () => {
        if (!reelData.isLikedByUser) { // Only like if not already liked
            handleLikeClick();
             // TODO: Add visual feedback like a heart animation overlay
        }
    };


    return (
        // Individual Reel container: w-full on mobile, max-width on desktop, full height, snap point
        // Added 'reel-item-container' class for easier selection in ReelsFeed scroll logic
        <div
            ref={ref} // Attach the ref forwarded from ReelsFeed
            className={cn(
                "reel-item-container relative w-full md:max-w-sm lg:max-w-md h-screen snap-start flex items-center justify-center", // Adjust max-w-sm/md as desired
                 // Optional: Add background color to Reel container itself? Usually black background is just the body/feed container.
            )}
            // Double click listener is attached to the Reel container
             onDoubleClick={handleDoubleClick}
        >
            {/* Video Player (fills the Reel container) */}
            <VideoPlayer
                src={reelData?.media?.[0]?.url} // Assuming first media is the video
                isPlaying={isPlaying}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onTogglePlayPause={handleTogglePlayPause}
                 // Pass the double click handler down if VideoPlayer needs it (e.g., for heart animation)
                onDoubleClick={handleDoubleClick}
            />

            {/* Overlay UI (positioned absolutely to cover the VideoPlayer) */}
            <ReelOverlayUI
                reelData={reelData}
                onLikeClick={handleLikeClick}
                onCommentClick={handleCommentClick}
                onShareClick={handleShareClick}
                onBookmarkClick={handleBookmarkClick}
                onDotsClick={handleDotsClick}
            />

            {/* Modals - Reuse your existing components */}
            {/* You might want to manage the state of these modals in ReelsFeed
                and pass down functions to open them to avoid re-rendering modals
                for every Reel item. But for simplicity, keeping them local here. */}
            {showShareModal && (
                <ShareModel
                    // ... props for ShareModel specific to Reel ...
                     postId={reelData._id}
                    setModelTrigger={setShowShareModal}
                />
            )}

            {showCommentsModal && (
                 <BottomComments
                     // ... props for BottomComments specific to Reel ...
                      postId={reelData._id}
                      isOpen={showCommentsModal}
                      setOpen={setShowCommentsModal}
                 />
             )}

             {showLikesModal && (
                 <LikesModel
                     // ... props for LikesModel specific to Reel ...
                      postId={reelData._id}
                     setLikesModelState={setShowLikesModal}
                 />
             )}

             {showReportModal && (
                 <ReportModel
                     // ... props for ReportModel specific to Reel ...
                      postId={reelData._id}
                     setModelTrigger={setShowReportModal}
                 />
             )}

            {/* Add the Reel 3-dots menu/modal here, triggered by handleDotsClick */}

        </div>
    );
});

// Important: Add a display name for components using forwardRef
Reel.displayName = 'Reel';

export default Reel;