// src/components/Reels/VideoPlayer.tsx
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
    src: string;
    isPlaying: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    onTogglePlayPause: () => void;
    onDoubleClick?: () => void; // Make optional if not always needed by player itself
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    isPlaying,
    isMuted,
    onToggleMute,
    onTogglePlayPause,
    onDoubleClick
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Play/Pause Effect
    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => {
                    console.error("Video play failed:", e);
                    // Potentially update state to show paused icon if play fails
                });
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Mute Effect
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    return (
        <div className="relative w-full h-full bg-black">
            <video
                ref={videoRef}
                src={src}
                loop
                playsInline
                preload="metadata" // Changed preload for performance
                className="w-full h-full object-cover"
                onClick={onTogglePlayPause}
                onDoubleClick={onDoubleClick} // Pass double-tap action
                // Mute property is controlled via useEffect
            />

             {/* Mute/Unmute Button */}
             <div className="absolute bottom-4 left-4 z-10">
                <button
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                    onClick={onToggleMute}
                    className="p-2 bg-black/60 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white" // Added focus style
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">...</svg> // Mute Icon
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">...</svg> // Unmute Icon
                    )}
                </button>
            </div>

             {/* Play Icon Overlay When Paused */}
             {!isPlaying && (
                 <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none"> {/* Lower z-index than buttons */}
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white opacity-80 drop-shadow-lg">...</svg> {/* Play Icon */}
                 </div>
             )}

             {/* TODO: Progress Bar Implementation */}
        </div>
    );
};
export default VideoPlayer;

