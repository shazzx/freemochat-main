import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const ReelItem = ({ reel, onPress }) => {
    const getThumbnailUrl = () => {
        if (reel.media && reel.media.length > 0) {
            if (reel.media[0].thumbnail) {
                return reel.media[0].thumbnail;
            }
        }
        return 'https://via.placeholder.com/200x360/333333/FFFFFF?text=Video';
    };

    const thumbnailUrl = getThumbnailUrl();

    const handleReelPress = useCallback(() => {
        const enrichedReel = {
            ...reel,
            isSuggested: true,
            _navigationTimestamp: Date.now()
        };
        onPress(enrichedReel);
    }, [reel, onPress]);

    return (
        <div
            className="reel-item-container cursor-pointer flex-shrink-0"
            onClick={handleReelPress}
            style={{
                width: 'calc(33.333% - 8px)', 
                aspectRatio: '9/16', 
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                minHeight: '200px'
            }}
        >
            <div className="thumbnail-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img
                    src={thumbnailUrl}
                    alt="Reel thumbnail"
                    className="w-full h-full object-cover"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />

                <div
                    className="overlay"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'backgroundColor 0.2s ease'
                    }}
                >
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ opacity: 0.9 }}
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                        pointerEvents: 'none'
                    }}
                />
            </div>
        </div>
    );
};

const ReelsSuggestionSection = ({ reels, navigateToReels }) => {
    const navigate = useNavigate();

    
    const validReels = reels
        .filter(reel => reel?.media && reel?.media.length > 0)
        .slice(0, 3); 

    const handleNavigateToReels = useCallback((reel) => {
        
        navigate(`/reels/${reel._id}`, {
            state: {
                sourceMode: 'videosFeed',
                initialReelId: reel._id,
                reelData: {
                    ...reel,
                    isSuggested: true,
                    _navigationTimestamp: Date.now()
                }
            }
        });
    }, [navigate]);
    if (validReels.length === 0) return null;

    return (
        <div className="w-full bg-card border border-muted rounded-lg overflow-hidden mb-2">
            <div className="flex justify-between items-center p-4 pb-3">
                <h3 className="text-lg font-semibold text-foreground m-0">
                    Suggested Reels
                </h3>
                <button
                    className="text-primary text-sm hover:underline bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-primary/80"
                    onClick={() => {
                        navigate('/reels');
                    }}
                >
                    See All
                </button>
            </div>

            <div className="px-4 pb-4">
                <div
                    className="flex gap-3 w-full"
                    style={{
                        display: 'flex',
                        gap: '12px',
                        width: '100%'
                    }}
                >
                    {validReels.map((reel) => (
                        <ReelItem
                            key={reel._id}
                            reel={reel}
                            onPress={handleNavigateToReels}
                        />
                    ))}

                    {validReels.length < 3 && Array.from({ length: 3 - validReels.length }).map((_, index) => (
                        <div
                            key={`empty-${index}`}
                            className="flex-shrink-0 bg-muted/20 rounded-lg border-2 border-dashed border-muted/40 flex items-center justify-center"
                            style={{
                                width: 'calc(33.333% - 8px)',
                                aspectRatio: '9/16',
                                minHeight: '200px'
                            }}
                        >
                            <div className="text-center text-muted-foreground/60">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="mx-auto mb-2"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="m2 17 10 5 10-5" />
                                    <path d="m2 12 10 5 10-5" />
                                </svg>
                                <p className="text-xs">More coming soon</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReelsSuggestionSection;