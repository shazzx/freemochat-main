// VideoPlaybackManager.tsx
// Web version of VideoPlaybackManager
class VideoPlaybackManager {
  private currentlyPlayingId: string | null = null;
  private lastActiveId: string | null = null;
  private videoRefs = new Map<string, React.RefObject<HTMLVideoElement>>();
  private videoStates = new Map<string, any>();
  private videoMetadata = new Map<string, any>();
  private manuallyPausedIds = new Set<string>();
  private preloadedVideos = new Set<string>();
  private visibleVideoIds = new Set<string>();
  private metrics = {
    playbackStarts: 0,
    playbackErrors: 0,
    memoryWarnings: 0
  };

  constructor() {
    // Initialize observer for memory pressure if available
    if (('performance' in window) && ('memory' in performance)) {
      this.setupMemoryObserver();
    }
  }

  /**
   * Setup periodic memory monitoring
   */
  private setupMemoryObserver() {
    // Check memory usage periodically (every 5 seconds)
    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedHeapRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usedHeapRatio > 0.7) {
          console.warn('High memory usage detected:', 
            (usedHeapRatio * 100).toFixed(1) + '%');
          this.handleMemoryWarning();
        }
      }
    }, 5000);
  }

  /**
   * Register a video component with the manager
   */
  registerVideo(id: string, ref: React.RefObject<HTMLVideoElement>) {
    this.videoRefs.set(id, ref);
    
    // Initialize video state if not present
    if (!this.videoStates.has(id)) {
      this.videoStates.set(id, {
        isPlaying: false,
        isLoaded: false,
        position: 0,
        lastUpdated: Date.now(),
        loadCount: 0,
        errorCount: 0
      });
    }
    
    return () => this.unregisterVideo(id);
  }

  /**
   * Unregister a video component
   */
  unregisterVideo(id: string) {
    this.videoRefs.delete(id);
    
    // If this was the active video, clear it
    if (this.currentlyPlayingId === id) {
      this.lastActiveId = id;
      this.currentlyPlayingId = null;
    }
    
    this.manuallyPausedIds.delete(id);
    this.visibleVideoIds.delete(id);
    this.preloadedVideos.delete(id);
  }

  /**
   * Notify the manager that a video was manually paused
   */
  notifyVideoPaused(id: string) {
    if (this.currentlyPlayingId === id) {
      this.manuallyPausedIds.add(id);
      this.currentlyPlayingId = null;
      
      // Update video state
      const videoState = this.videoStates.get(id);
      if (videoState) {
        this.videoStates.set(id, {
          ...videoState,
          isPlaying: false,
          lastUpdated: Date.now()
        });
      }
      
      console.log(`Video ${id} manually paused by user`);
    }
  }

  /**
   * Check if a video is manually paused
   */
  isVideoManuallyPaused(id: string): boolean {
    return this.manuallyPausedIds.has(id);
  }

  /**
   * Clear manual pause state for a video
   */
  clearManualPauseState(id: string) {
    this.manuallyPausedIds.delete(id);
  }

  /**
   * Get video error state
   */
  getVideoErrorState(id: string) {
    const videoState = this.videoStates.get(id);
    if (!videoState) return null;
    
    return {
      errorCount: videoState.errorCount || 0,
      lastError: videoState.lastError || null,
      loadCount: videoState.loadCount || 0
    };
  }

  /**
   * Clear error state for a video
   */
  clearVideoErrorState(id: string) {
    const videoState = this.videoStates.get(id);
    if (!videoState) return;
    
    this.videoStates.set(id, {
      ...videoState,
      error: false,
      lastError: null,
      errorCount: 0
    });
  }

  /**
   * Mark a video as visible
   */
  setVideoVisible(id: string, isVisible: boolean, options: any = {}) {
    if (isVisible) {
      this.visibleVideoIds.add(id);
      
      // Store URI for preloading if provided
      if (options.uri) {
        this.videoMetadata.set(id, {
          ...(this.videoMetadata.get(id) || {}),
          uri: options.uri,
          isCached: options.isCached,
          index: options.index
        });
      }
    } else {
      this.visibleVideoIds.delete(id);
      
      // Clear manual pause state when video goes off screen
      this.clearManualPauseState(id);
    }
  }

  /**
   * Set currently playing video
   */
  async setCurrentlyPlaying(id: string, options: any = {}) {
    // Skip if already playing
    if (this.currentlyPlayingId === id && !options.force) return;
    
    // Skip if manually paused, unless forced
    if (this.manuallyPausedIds.has(id) && !options.force) {
      console.log(`Skipping auto-play for manually paused video: ${id}`);
      return;
    }
    
    try {
      // Track metrics
      this.metrics.playbackStarts++;
      
      // Pause currently playing video first
      await this.pauseCurrentlyPlaying();
      
      // Set new active video
      this.lastActiveId = this.currentlyPlayingId;
      this.currentlyPlayingId = id;
      
      // Remove from manually paused videos
      this.manuallyPausedIds.delete(id);
      
      // Try to play the new video
      const videoRef = this.videoRefs.get(id);
      if (videoRef && videoRef.current) {
        // Check if needs restart
        if (options.reset) {
          videoRef.current.currentTime = 0;
        }
        
        // Start playing
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log(`Autoplay prevented by browser policy: ${error.message}`);
              
              // Try muted playback as fallback (browser policy often allows this)
              if (error.name === 'NotAllowedError') {
                console.log('Trying muted playback instead');
                videoRef.current!.muted = true;
                videoRef.current!.play().catch(e => 
                  console.log('Even muted playback failed:', e));
              }
            });
          }
        } catch (error) {
          console.error(`Error playing video: ${error}`);
        }
        
        // Update video state
        const videoState = this.videoStates.get(id) || {};
        this.videoStates.set(id, {
          ...videoState,
          isPlaying: true,
          isLoaded: true,
          position: 0,
          lastUpdated: Date.now()
        });
        
        // Prefetch adjacent videos if requested
        if (options.prefetchAdjacent && options.videos && 
            options.currentIndex !== undefined) {
          this.prefetchAdjacentVideos(
            options.videos, 
            options.currentIndex, 
            options.prefetchRange || 3
          );
        }
        
        // Check for loading next page
        if (options.checkForNextPage && options.currentIndex !== undefined &&
            options.videos && options.loadNextPage) {
          this.checkAndLoadNextPage(
            options.videos, 
            options.currentIndex, 
            options.loadNextPage
          );
        }
      }
    } catch (error) {
      console.error(`Error setting currently playing video (${id}):`, error);
      this.metrics.playbackErrors++;
      
      // Update error state
      const videoState = this.videoStates.get(id) || {};
      this.videoStates.set(id, {
        ...videoState,
        isPlaying: false,
        error: true,
        errorMessage: error.message,
        errorCount: (videoState.errorCount || 0) + 1,
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * Pause the currently playing video
   */
  async pauseCurrentlyPlaying() {
    if (!this.currentlyPlayingId) return;
    
    try {
      const videoRef = this.videoRefs.get(this.currentlyPlayingId);
      if (videoRef && videoRef.current) {
        // Get current position before pausing
        const position = videoRef.current.currentTime * 1000; // convert to ms
        
        // Pause the video
        videoRef.current.pause();
        
        // Update video state
        const videoState = this.videoStates.get(this.currentlyPlayingId) || {};
        this.videoStates.set(this.currentlyPlayingId, {
          ...videoState,
          isPlaying: false,
          position,
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error('Error pausing video:', error);
    }
  }

  /**
   * Prefetch adjacent videos for smoother playback
   */
  prefetchAdjacentVideos(videos: any[], currentIndex: number, range: number = 3) {
    // Web implementation can use preload attribute or create hidden video elements
    console.log(`Prefetching ${range} videos around index ${currentIndex}`);
    
    // Forward prefetch
    for (let i = 1; i <= range; i++) {
      const index = currentIndex + i;
      if (index < videos.length) {
        const video = videos[index];
        if (video && video.mediaSrc) {
          this.prefetchVideo(video.mediaSrc, i);
        }
      }
    }
    
    // Backward prefetch (fewer)
    for (let i = 1; i <= Math.min(2, range); i++) {
      const index = currentIndex - i;
      if (index >= 0) {
        const video = videos[index];
        if (video && video.mediaSrc) {
          this.prefetchVideo(video.mediaSrc, i + range);
        }
      }
    }
  }

  /**
   * Prefetch a single video
   */
  private prefetchVideo(url: string, priority: number) {
    // Create a link element with preload hint
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'video';
    
    // Add priority attribute for modern browsers
    if ('importance' in link) {
      (link as any).importance = priority <= 2 ? 'high' : 'low';
    }
    
    // Add to document head
    document.head.appendChild(link);
    
    // Remove after a delay to avoid cluttering the DOM
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 60000); // Remove after 1 minute
  }

  /**
   * Check if we need to load the next page of videos
   */
  checkAndLoadNextPage(videos: any[], currentIndex: number, loadNextPage: Function) {
    // If we're within 4 videos of the end, load more
    const THRESHOLD = 4;
    if (currentIndex >= videos.length - THRESHOLD) {
      console.log(`Near end of video list (index ${currentIndex} of ${videos.length}), loading more...`);
      loadNextPage();
    }
  }

  /**
   * Handle memory pressure warning
   */
  private handleMemoryWarning() {
    // Release non-essential videos
    this.preloadedVideos.forEach(id => {
      if (id !== this.currentlyPlayingId) {
        const videoRef = this.videoRefs.get(id);
        if (videoRef && videoRef.current) {
          // Unload by removing src
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        }
      }
    });
    
    // Clear tracking except for current video
    this.preloadedVideos = new Set(
      this.currentlyPlayingId ? [this.currentlyPlayingId] : []
    );
    
    // Run garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Get playback statistics
   */
  getStats() {
    return {
      currentlyPlaying: this.currentlyPlayingId,
      visibleVideos: this.visibleVideoIds.size,
      preloadedVideos: this.preloadedVideos.size,
      registeredVideos: this.videoRefs.size,
      manuallyPausedVideos: this.manuallyPausedIds.size,
      playbackMetrics: this.metrics
    };
  }
}

// Export singleton instance
const videoPlaybackManager = new VideoPlaybackManager();
export default videoPlaybackManager;