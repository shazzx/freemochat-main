// ALTERNATIVE APPROACH: Event-driven tracking (No periodic checking at all!)
// REPLACE THE ENTIRE VideoViewTracker class with this optimized version:

import { axiosClient } from '@/api/axiosClient';

class VideoViewTracker {
    private viewedVideos = new Map();
    private pendingViews: string[] = [];
    private processingViews: string[] = [];
    private processedVideos = new Set();
    private qualificationTimers = new Map<string, number>(); // Store timers for each video

    private userId: string | null = null;
    private batchSize: number = 12;
    private minimumViewDuration: number = 4000; // 4 seconds
    private isSendingBatch: boolean = false;
    private debug: boolean = false;
    private totalSentViews: number = 0;
    private lastBatchTime: Date | null = null;
    private lastError: any = null;

    /**
     * Set the user ID for view tracking
     */
    setUserId(userId: string) {
        if (!userId) {
            this.logDebug('Invalid userId provided');
            console.error('VideoViewTracker: Invalid userId provided');
            return;
        }
        
        if (this.userId === userId) {
            this.logDebug(`User ID already set: ${userId}`);
            return;
        }
        
        this.userId = userId;
        this.logDebug(`User ID set: ${userId}`);
        console.log(`VideoViewTracker: User ID set to ${userId}`);
        
        // Reset state when user changes
        if (this.viewedVideos.size > 0 || this.pendingViews.length > 0) {
            console.warn('VideoViewTracker: User ID changed with pending data. Clearing state.');
            this.clearAllTimers();
            this.viewedVideos.clear();
            this.pendingViews = [];
            this.processingViews = [];
            this.processedVideos.clear();
        }
    }

    /**
     * Enable or disable debug logging
     */
    setDebug(enabled: boolean) {
        this.debug = enabled;
    }

    /**
     * NO PERIODIC CHECKING NEEDED - Using event-driven approach
     */
    startPeriodicChecking() {
        this.logDebug('Using event-driven tracking - no periodic checking needed');
        console.log('VideoViewTracker: Using optimized event-driven approach');
    }

    stopPeriodicChecking() {
        this.clearAllTimers();
        this.logDebug('Cleared all qualification timers');
    }

    /**
     * Clear all timers
     */
    private clearAllTimers() {
        this.qualificationTimers.forEach((timerId) => {
            clearTimeout(timerId);
        });
        this.qualificationTimers.clear();
    }

    /**
     * Start tracking a video
     */
    startTracking(videoData: { videoId: string, duration?: number, type: string }): boolean {
        if (!videoData || !videoData.videoId) {
            console.error('VideoViewTracker: Invalid video data provided to startTracking');
            return false;
        }

        const { videoId } = videoData;

        if (!this.userId) {
            console.error(`VideoViewTracker: Cannot track video ${videoId} - no userId set`);
            return false;
        }

        // Don't track again if already processed
        if (this.processedVideos.has(videoId)) {
            this.logDebug(`Video ${videoId} already processed.`);
            return false;
        }

        // Clear any existing timer for this video
        if (this.qualificationTimers.has(videoId)) {
            clearTimeout(this.qualificationTimers.get(videoId)!);
            this.qualificationTimers.delete(videoId);
        }

        // Check if already being tracked
        if (this.viewedVideos.has(videoId)) {
            const existingData = this.viewedVideos.get(videoId);
            if (!existingData.qualified) {
                existingData.entryTime = Date.now();
                this.logDebug(`Video ${videoId} already being tracked but not qualified. Resetting entry time.`);
                console.log(`VideoViewTracker: Reset tracking time for video ${videoId}`);
                return true;
            }
        }

        // If not in pendingViews, create new tracking
        if (!this.pendingViews.includes(videoId)) {
            this.viewedVideos.set(videoId, {
                videoId,
                startTime: Date.now(),
                hasPlayedOnce: false,
                entryTime: Date.now(),
                qualified: false
            });

            this.logDebug(`Started tracking video: ${videoId}.`);
            console.log(`VideoViewTracker: Started tracking video ${videoId}`);
        }

        return true;
    }

    /**
     * Update video playback state - EVENT DRIVEN
     */
    updatePlaybackState(videoId: string, isPlaying: boolean): boolean {
        if (!videoId || !this.userId) return false;

        // If already processed, skip
        if (this.pendingViews.includes(videoId) || this.processedVideos.has(videoId)) {
            return false;
        }

        // Start tracking if not already
        if (!this.viewedVideos.has(videoId)) {
            this.startTracking({ videoId, type: 'video' });
        }

        const trackingData = this.viewedVideos.get(videoId);
        if (!trackingData) return false;

        // If video starts playing for the first time, set up qualification timer
        if (isPlaying && !trackingData.hasPlayedOnce) {
            trackingData.hasPlayedOnce = true;
            trackingData.entryTime = Date.now();
            
            console.log(`VideoViewTracker: Video ${videoId} started playing - setting ${this.minimumViewDuration}ms timer`);
            
            // Set up a timer to qualify this video after the minimum duration
            const timerId = window.setTimeout(() => {
                this.qualifyVideo(videoId);
                this.qualificationTimers.delete(videoId);
            }, this.minimumViewDuration);
            
            this.qualificationTimers.set(videoId, timerId);
            
        } else if (!isPlaying && this.qualificationTimers.has(videoId)) {
            // If video is paused, cancel the timer (but keep tracking data)
            clearTimeout(this.qualificationTimers.get(videoId)!);
            this.qualificationTimers.delete(videoId);
            console.log(`VideoViewTracker: Video ${videoId} paused - qualification timer cancelled`);
        } else if (isPlaying && trackingData.hasPlayedOnce && !this.qualificationTimers.has(videoId) && !trackingData.qualified) {
            // Video resumed playing - calculate remaining time and set new timer
            const timeAlreadyWatched = Date.now() - trackingData.entryTime;
            const remainingTime = Math.max(0, this.minimumViewDuration - timeAlreadyWatched);
            
            if (remainingTime > 0) {
                console.log(`VideoViewTracker: Video ${videoId} resumed - setting ${remainingTime}ms timer`);
                const timerId = window.setTimeout(() => {
                    this.qualifyVideo(videoId);
                    this.qualificationTimers.delete(videoId);
                }, remainingTime);
                
                this.qualificationTimers.set(videoId, timerId);
            } else {
                // Should already be qualified
                this.qualifyVideo(videoId);
            }
        }

        trackingData.isPlaying = isPlaying;
        return true;
    }

    /**
     * Qualify a video immediately
     */
    private qualifyVideo(videoId: string) {
        const data = this.viewedVideos.get(videoId);
        if (!data || data.qualified) return;

        const actualTimeWatched = Date.now() - data.entryTime;
        this.logDebug(`QUALIFIED: Video ${videoId} after ${actualTimeWatched}ms of viewing time`);
        console.log(`VideoViewTracker: Video ${videoId} qualified after ${actualTimeWatched}ms`);
        
        this.registerView(videoId);
        data.qualified = true;
    }

    /**
     * Register a video as viewed
     */
    private registerView(videoId: string) {
        // Don't add duplicates
        if (this.pendingViews.includes(videoId) ||
            this.processingViews.includes(videoId) ||
            this.processedVideos.has(videoId)) {
            this.logDebug(`Video ${videoId} already pending, processing, or sent. Skipping registration.`);
            return;
        }

        // Add to pending views
        this.pendingViews.push(videoId);
        this.logDebug(`Registered view for video: ${videoId}. Pending: ${this.pendingViews.length}/${this.batchSize}`);
        console.log(`VideoViewTracker: Registered view for ${videoId}. Pending: ${this.pendingViews.length}/${this.batchSize}`);

        // If batch size reached, send immediately
        if (this.pendingViews.length >= this.batchSize) {
            this.logDebug(`*** BATCH SIZE REACHED (${this.pendingViews.length}/${this.batchSize}). Sending batch now. ***`);
            console.log(`VideoViewTracker: Batch size reached! Sending ${this.pendingViews.length} views`);

            this.sendBatchToServer(false).catch(err => {
                console.error("Error sending batch:", err);
            });
        }
    }

    /**
     * Stop tracking a video
     */
    stopTracking(videoId: string) {
        if (!videoId) return;

        // Clear any timer for this video
        if (this.qualificationTimers.has(videoId)) {
            clearTimeout(this.qualificationTimers.get(videoId)!);
            this.qualificationTimers.delete(videoId);
        }

        // If video was being tracked and has played, check if it should be qualified
        if (this.viewedVideos.has(videoId)) {
            const videoData = this.viewedVideos.get(videoId);
            this.logDebug(`Stopping tracking for ${videoId}`);

            if (videoData.hasPlayedOnce && !videoData.qualified) {
                const timeSpent = Date.now() - videoData.entryTime;
                if (timeSpent >= this.minimumViewDuration) {
                    this.logDebug(`STOP QUALIFIED: Video ${videoId} with ${timeSpent}ms viewing time`);
                    console.log(`VideoViewTracker: Video ${videoId} qualified on stop with ${timeSpent}ms`);
                    this.registerView(videoId);
                } else {
                    this.logDebug(`Video ${videoId} not qualified: only ${timeSpent}ms of viewing time`);
                }
            }

            // Remove from tracked videos
            this.viewedVideos.delete(videoId);
        }
    }

    /**
     * Send a batch of views to the server
     */
    async sendBatchToServer(forceSend: boolean = false): Promise<void> {
        if (this.pendingViews.length === 0 || !this.userId || this.isSendingBatch) {
            return;
        }

        if (!forceSend && this.pendingViews.length < this.batchSize) {
            return;
        }

        try {
            this.isSendingBatch = true;

            const batchToSend = forceSend ?
                [...this.pendingViews] :
                this.pendingViews.slice(0, this.batchSize);

            this.processingViews = [...batchToSend];
            this.pendingViews = this.pendingViews.filter(id => !batchToSend.includes(id));

            console.log(`VideoViewTracker: Sending batch of ${batchToSend.length} views`);

            const payload = {
                userId: this.userId,
                viewedPosts: batchToSend,
                type: 'video',
            };

            const response = await axiosClient.post('posts/view/bulk', payload);

            if (response && response.data) {
                console.log(`VideoViewTracker: Successfully sent ${batchToSend.length} views!`);
                batchToSend.forEach(id => this.processedVideos.add(id));
                this.totalSentViews += batchToSend.length;
                this.lastBatchTime = new Date();
            } else {
                throw new Error('Invalid server response');
            }
        } catch (error) {
            console.error(`VideoViewTracker: Failed to send views:`, error);
            this.pendingViews = [...this.processingViews, ...this.pendingViews];
            this.lastError = { message: error.message, time: new Date().toISOString() };
        } finally {
            this.processingViews = [];
            this.isSendingBatch = false;

            // Check if we can send another batch
            if (this.pendingViews.length >= this.batchSize) {
                setTimeout(() => {
                    this.sendBatchToServer(false).catch(err => console.error("Error in next batch:", err));
                }, 1000);
            }
        }
    }

    /**
     * Cleanup - force send remaining views and clear timers
     */
    async cleanup(): Promise<void> {
        console.log(`VideoViewTracker CLEANUP: Pending=${this.pendingViews.length}, Tracking=${this.viewedVideos.size}`);

        // Clear all timers first
        this.clearAllTimers();

        // Check any videos still being tracked for immediate qualification
        const now = Date.now();
        this.viewedVideos.forEach((data, videoId) => {
            if (!data.qualified && data.hasPlayedOnce) {
                const timeSpent = now - data.entryTime;
                if (timeSpent >= this.minimumViewDuration) {
                    console.log(`VideoViewTracker CLEANUP: Qualifying ${videoId} with ${timeSpent}ms`);
                    this.registerView(videoId);
                    data.qualified = true;
                }
            }
        });

        // Force send any pending views
        if (this.pendingViews.length > 0 && this.userId) {
            console.log(`VideoViewTracker CLEANUP: Force sending ${this.pendingViews.length} views`);
            try {
                await this.sendBatchToServer(true);
                console.log("VideoViewTracker CLEANUP: Force send complete");
            } catch (error) {
                console.error("VideoViewTracker CLEANUP: Force send failed:", error);
            }
        }

        // Clear all data
        this.viewedVideos.clear();
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            userIdSet: !!this.userId,
            isPeriodicChecking: false, // We don't use periodic checking
            activeTrackingCount: this.viewedVideos.size,
            pendingViews: this.pendingViews.length,
            processingViews: this.processingViews.length,
            batchSize: this.batchSize,
            totalSentViews: this.totalSentViews,
            lastBatchTime: this.lastBatchTime ? this.lastBatchTime.toISOString() : null,
            lastError: this.lastError,
            activeTimers: this.qualificationTimers.size,
            trackingMethod: 'Event-Driven (Optimized)'
        };
    }

    /**
     * Enhanced logging
     */
    private logDebug(message: string) {
        if (this.debug) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[VideoViewTracker ${timestamp}] ${message}`);
        }
    }
}

// Create a singleton instance
const videoViewTracker = new VideoViewTracker();
export default videoViewTracker;