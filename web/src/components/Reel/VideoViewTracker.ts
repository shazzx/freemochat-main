import { axiosClient } from '@/api/axiosClient';

class VideoViewTracker {
    private viewedVideos = new Map();
    private pendingViews: string[] = [];
    private processingViews: string[] = [];
    private processedVideos = new Set();

    private userId: string | null = null;
    private batchSize: number = 12;
    private minimumViewDuration: number = 4000; // 4 seconds
    private isSendingBatch: boolean = false;
    private checkInterval: number | null = null;
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
            return;
        }
        this.userId = userId;
        this.logDebug(`User ID set: ${userId}`);
    }

    /**
     * Enable or disable debug logging
     */
    setDebug(enabled: boolean) {
        this.debug = enabled;
    }

    /**
     * Start periodic checking
     */
    startPeriodicChecking() {
        this.stopPeriodicChecking();
        this.checkInterval = window.setInterval(() => {
            this.checkViewDurations();
        }, 1000);
        this.logDebug('Started periodic video checking.');
    }

    /**
     * Stop periodic checking
     */
    stopPeriodicChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.logDebug('Stopped periodic video checking.');
        }
    }

    /**
     * Start tracking a video
     */
    startTracking(videoData: { videoId: string, duration?: number, type: string }): boolean {
        if (!videoData || !videoData.videoId) return false;

        const { videoId } = videoData;

        // Don't track again if already processed
        if (this.processedVideos.has(videoId)) {
            this.logDebug(`Video ${videoId} already processed.`);
            return false;
        }

        // Check if already being tracked
        if (this.viewedVideos.has(videoId)) {
            // If already being tracked but not qualified yet, just reset the entry time
            const existingData = this.viewedVideos.get(videoId);
            if (!existingData.qualified) {
                existingData.entryTime = Date.now();
                existingData.lastChecked = Date.now();
                this.logDebug(`Video ${videoId} already being tracked but not qualified. Resetting entry time.`);
                return true;
            }
        }

        // If not in pendingViews (already qualified but not sent), create new tracking
        if (!this.pendingViews.includes(videoId)) {
            // Create or reset tracking
            this.viewedVideos.set(videoId, {
                videoId,
                startTime: Date.now(),
                hasPlayedOnce: false,
                entryTime: Date.now(),
                lastChecked: Date.now(),
                qualified: false
            });

            this.logDebug(`Started tracking video: ${videoId}.`);
        } else {
            this.logDebug(`Video ${videoId} already in pendingViews. Not tracking again.`);
        }

        return true;
    }

    // VideoViewTracker.tsx (continued)

    /**
     * Update video playback state
     */
    updatePlaybackState(videoId: string, isPlaying: boolean): boolean {
        if (!videoId) return false;

        // If already qualified and in pendingViews or processed, nothing to update
        if (this.pendingViews.includes(videoId) || this.processedVideos.has(videoId)) {
            return false;
        }

        // If not currently being tracked, start tracking it
        if (!this.viewedVideos.has(videoId)) {
            this.logDebug(`Video ${videoId} not being tracked yet, starting tracking on playback update.`);
            this.startTracking({ videoId, type: 'video' });
        }

        const trackingData = this.viewedVideos.get(videoId);
        if (!trackingData) return false;

        // If video starts playing for the first time, mark it
        if (isPlaying && !trackingData.hasPlayedOnce) {
            trackingData.hasPlayedOnce = true;
            trackingData.entryTime = Date.now(); // Reset entry time when actually playing
            this.logDebug(`Video ${videoId} has started playing for the first time.`);
        }

        // Update the playing state
        trackingData.isPlaying = isPlaying;

        // If was already playing and still playing, just update the last checked time
        if (isPlaying) {
            trackingData.lastChecked = Date.now();
        }

        return true;
    }

    /**
     * Check all videos being tracked for qualification
     */
    private checkViewDurations() {
        const now = Date.now();
        let qualifiedCount = 0;

        if (this.debug && this.viewedVideos.size > 0) {
            console.log(`Checking ${this.viewedVideos.size} videos for qualification...`);
        }

        this.viewedVideos.forEach((data, videoId) => {
            // Skip already qualified videos
            if (data.qualified) return;

            // Only consider videos that have started playing at least once
            if (data.hasPlayedOnce) {
                // Calculate time spent on this video
                const timeSpent = now - data.entryTime;

                // Log current duration for all videos being tracked
                if (this.debug) {
                    console.log(`[CHECK] Video ${videoId}: played=${data.hasPlayedOnce}, time=${timeSpent}ms / ${this.minimumViewDuration}ms`);
                }

                // If user has spent enough time, qualify it
                if (timeSpent >= this.minimumViewDuration) {
                    this.logDebug(`QUALIFIED: Video ${videoId} after ${timeSpent}ms of viewing time`);
                    this.registerView(videoId);
                    data.qualified = true;
                    qualifiedCount++;
                }
            } else if (this.debug) {
                console.log(`[CHECK] Video ${videoId} hasn't played yet, can't qualify.`);
            }
        });

        if (qualifiedCount > 0) {
            this.logDebug(`Periodic check: ${qualifiedCount} new videos qualified.`);
        }
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

        // If batch size reached, send immediately
        if (this.pendingViews.length >= this.batchSize) {
            this.logDebug(`*** BATCH SIZE REACHED (${this.pendingViews.length}/${this.batchSize}). Sending batch now. ***`);

            // Force immediate execution
            this.sendBatchToServer(false).catch(err => {
                console.error("Error sending batch:", err);
            });
        } else {
            this.logDebug(`Batch size not yet reached (${this.pendingViews.length}/${this.batchSize}). Waiting for more views.`);
        }
    }

    /**
     * Stop tracking a video
     */
    stopTracking(videoId: string) {
        if (!videoId || !this.viewedVideos.has(videoId)) return;

        const videoData = this.viewedVideos.get(videoId);
        this.logDebug(`Stopping tracking for ${videoId}`);

        // If the video was playing and has enough time, qualify it
        if (videoData.hasPlayedOnce && !videoData.qualified) {
            const timeSpent = Date.now() - videoData.entryTime;
            if (timeSpent >= this.minimumViewDuration) {
                this.logDebug(`STOP QUALIFIED: Video ${videoId} with ${timeSpent}ms viewing time`);
                this.registerView(videoId);
            } else {
                this.logDebug(`Video ${videoId} not qualified: only ${timeSpent}ms of viewing time`);
            }
        }

        // Remove from tracked videos
        this.viewedVideos.delete(videoId);
    }

    /**
     * Send a batch of views to the server
     */
    async sendBatchToServer(forceSend: boolean = false): Promise<void> {
        this.logDebug(`sendBatchToServer called with forceSend=${forceSend}`);
        console.log(`ATTEMPTING sendBatchToServer with forceSend=${forceSend}, pending=${this.pendingViews.length}`);

        if (this.pendingViews.length === 0) {
            this.logDebug('No pending views to send');
            return;
        }

        if (!this.userId) {
            this.logDebug('No userId set, cannot send batch');
            console.error('CRITICAL: Cannot send batch - userId not set');
            return;
        }

        if (this.isSendingBatch) {
            this.logDebug('Already sending a batch, will try later');
            return;
        }

        // When not forcing, only send if we have enough
        if (!forceSend && this.pendingViews.length < this.batchSize) {
            this.logDebug(`Not enough views to send (${this.pendingViews.length}/${this.batchSize}) and not forcing`);
            return;
        }

        try {
            // Set sending flag
            this.isSendingBatch = true;

            // Get batch of videos to send
            const batchToSend = forceSend ?
                [...this.pendingViews] :
                this.pendingViews.slice(0, this.batchSize);

            // Move from pending to processing
            this.processingViews = [...batchToSend];
            this.pendingViews = this.pendingViews.filter(id => !batchToSend.includes(id));

            this.logDebug(`SENDING BATCH NOW: ${batchToSend.length} views. Force: ${forceSend}`);
            console.log(`Sending batch of ${batchToSend.length} views to server:`, JSON.stringify(batchToSend));

            // Prepare the payload
            const payload = {
                userId: this.userId,
                viewedPosts: batchToSend,
                type: 'video',
            };

            console.log("Sending payload:", JSON.stringify(payload));

            // Make the API call
            try {
                const response = await axiosClient.post('posts/view/bulk', payload);

                console.log("RESPONSE:", response?.status, response?.data ? JSON.stringify(response.data) : "No data");

                if (response && response.data) {
                    this.logDebug(`Successfully sent ${batchToSend.length} views to server!`);

                    // Add to processed videos set to avoid re-sending
                    batchToSend.forEach(id => this.processedVideos.add(id));

                    this.totalSentViews += batchToSend.length;
                    this.lastBatchTime = new Date();
                } else {
                    console.error("Invalid server response:", response);
                    throw new Error('Invalid server response');
                }
            } catch (apiError) {
                // Detailed API error logging
                console.error(`API call failed:`, apiError);
                console.error(`Request details: userId=${this.userId}, videos=${batchToSend.length}`);

                if (apiError.response) {
                    console.error("Response status:", apiError.response.status);
                    console.error("Response data:", JSON.stringify(apiError.response.data || {}));
                } else if (apiError.request) {
                    console.error("No response received, request was:", apiError.request);
                } else {
                    console.error("Error setting up request:", apiError.message);
                }

                throw apiError; // Re-throw to be caught by outer catch
            }
        } catch (error) {
            console.error(`Failed to send views:`, error);
            // Re-queue failed views
            this.pendingViews = [...this.processingViews, ...this.pendingViews];
            this.lastError = { message: error.message, time: new Date().toISOString() };

            // Alert in development mode
            if (process.env.NODE_ENV === 'development') {
                console.error("DEVELOPER ALERT: Batch send failed. Check network and endpoint.");
            }
        } finally {
            this.processingViews = [];
            this.isSendingBatch = false;

            // Check if we can send another batch
            if (this.pendingViews.length >= this.batchSize) {
                this.logDebug(`Still have ${this.pendingViews.length} views. Sending next batch.`);
                setTimeout(() => {
                    this.sendBatchToServer(false).catch(err => console.error("Error in next batch:", err));
                }, 1000); // Small delay to avoid hammering the server
            }
        }
    }

    /**
     * Called when component unmounts - cleanup and send any pending views
     */
    async cleanup(): Promise<void> {
        this.logDebug(`Cleanup called. Pending: ${this.pendingViews.length}, Tracking: ${this.viewedVideos.size}`);
        console.log(`CLEANUP: Pending=${this.pendingViews.length}, Tracking=${this.viewedVideos.size}`);

        // Stop the periodic checking first
        this.stopPeriodicChecking();

        // Check any videos still being tracked but not yet qualified
        const now = Date.now();
        const newlyQualified: string[] = [];

        this.viewedVideos.forEach((data, videoId) => {
            if (!data.qualified && data.hasPlayedOnce) {
                const timeSpent = now - data.entryTime;
                if (timeSpent >= this.minimumViewDuration) {
                    this.logDebug(`CLEANUP QUALIFIED: Video ${videoId} after ${timeSpent}ms of viewing time`);
                    this.registerView(videoId);
                    newlyQualified.push(videoId);
                }
            }
        });

        if (newlyQualified.length > 0) {
            console.log(`CLEANUP: Qualified ${newlyQualified.length} additional videos before exit`);
        }

        // Force send any pending views - CRITICAL ON EXIT
        if (this.pendingViews.length > 0) {
            if (this.userId) {
                this.logDebug(`Cleanup: Forcing send of ${this.pendingViews.length} views on exit`);
                console.log(`FORCE SENDING ${this.pendingViews.length} VIEWS ON EXIT`);

                try {
                    await this.sendBatchToServer(true);
                    console.log("CLEANUP: Force send complete");
                } catch (error) {
                    console.error("CLEANUP: Force send failed:", error);
                }
            } else {
                console.error("CLEANUP: Cannot send views - userId not set!");
            }
        } else {
            console.log("CLEANUP: No pending views to send");
        }

        // Clean up tracking data
        this.viewedVideos.clear();
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            userIdSet: !!this.userId,
            isPeriodicChecking: !!this.checkInterval,
            activeTrackingCount: this.viewedVideos.size,
            pendingViews: this.pendingViews.length,
            processingViews: this.processingViews.length,
            batchSize: this.batchSize,
            totalSentViews: this.totalSentViews,
            lastBatchTime: this.lastBatchTime ? this.lastBatchTime.toISOString() : null,
            lastError: this.lastError
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