

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
    
    if (('performance' in window) && ('memory' in performance)) {
      this.setupMemoryObserver();
    }
  }

  private setupMemoryObserver() {
    
    
    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedHeapRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usedHeapRatio > 0.8) { 
          console.warn('High memory usage detected:',
            (usedHeapRatio * 100).toFixed(1) + '%');
          this.handleMemoryWarning();
        }
      }
    }, 30000); 
  }

  private prefetchVideo(url: string, priority: number) {
    
    
    if (this.preloadedVideos.has(url)) {
      return;
    }

    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'video';

    
    if ('importance' in link) {
      (link as any).importance = priority <= 2 ? 'high' : 'low';
    }

    
    document.head.appendChild(link);

    
    this.preloadedVideos.add(url);

    
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
        this.preloadedVideos.delete(url);
      }
    }, 120000); 
  }

  prefetchAdjacentVideos(videos: any[], currentIndex: number, range: number = 3) {
    
    requestIdleCallback(() => {
      console.log(`Prefetching up to ${range} videos around index ${currentIndex}`);

      
      for (let i = 1; i <= Math.min(range, 2); i++) { 
        const index = currentIndex + i;
        if (index < videos.length) {
          const video = videos[index];
          if (video?.media?.[0]?.url) { 
            this.prefetchVideo(video.media[0].url, i);
          }
        }
      }

      
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0 && videos[prevIndex]?.media?.[0]?.url) {
        this.prefetchVideo(videos[prevIndex].media[0].url, range + 1);
      }
    }, { timeout: 2000 }); 
  }

  
  
  registerVideo(id: string, ref: React.RefObject<HTMLVideoElement>) {
    this.videoRefs.set(id, ref);

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

  unregisterVideo(id: string) {
    this.videoRefs.delete(id);

    if (this.currentlyPlayingId === id) {
      this.lastActiveId = id;
      this.currentlyPlayingId = null;
    }

    this.manuallyPausedIds.delete(id);
    this.visibleVideoIds.delete(id);
    this.preloadedVideos.delete(id);
  }

  notifyVideoPaused(id: string) {
    if (this.currentlyPlayingId === id) {
      this.manuallyPausedIds.add(id);
      this.currentlyPlayingId = null;

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

  isVideoManuallyPaused(id: string): boolean {
    return this.manuallyPausedIds.has(id);
  }

  clearManualPauseState(id: string) {
    this.manuallyPausedIds.delete(id);
  }

  getVideoErrorState(id: string) {
    const videoState = this.videoStates.get(id);
    if (!videoState) return null;

    return {
      errorCount: videoState.errorCount || 0,
      lastError: videoState.lastError || null,
      loadCount: videoState.loadCount || 0
    };
  }

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


  setVideoVisible(id: string, isVisible: boolean, options: any = {}) {
    if (isVisible) {
      this.visibleVideoIds.add(id);

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
      this.clearManualPauseState(id);
    }
  }

  async setCurrentlyPlaying(id: string, options: any = {}) {
    if (this.currentlyPlayingId === id && !options.force) return;

    if (this.manuallyPausedIds.has(id) && !options.force) {
      return;
    }

    try {
      
      this.metrics.playbackStarts++;

      
      await this.pauseCurrentlyPlaying();

      
      this.lastActiveId = this.currentlyPlayingId;
      this.currentlyPlayingId = id;

      
      this.manuallyPausedIds.delete(id);

      
      const videoRef = this.videoRefs.get(id);
      if (videoRef && videoRef.current) {
        
        if (options.reset) {
          videoRef.current.currentTime = 0;
        }

        
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log(`Autoplay prevented by browser policy: ${error.message}`);

              
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

        
        const videoState = this.videoStates.get(id) || {};
        this.videoStates.set(id, {
          ...videoState,
          isPlaying: true,
          isLoaded: true,
          position: 0,
          lastUpdated: Date.now()
        });

        
        if (options.prefetchAdjacent && options.videos &&
          options.currentIndex !== undefined) {
          this.prefetchAdjacentVideos(
            options.videos,
            options.currentIndex,
            options.prefetchRange || 3
          );
        }

        
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

  async pauseCurrentlyPlaying() {
    if (!this.currentlyPlayingId) return;

    try {
      const videoRef = this.videoRefs.get(this.currentlyPlayingId);
      if (videoRef && videoRef.current) {
        
        const position = videoRef.current.currentTime * 1000; 

        
        videoRef.current.pause();

        
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


  checkAndLoadNextPage(videos: any[], currentIndex: number, loadNextPage: Function) {
    
    const THRESHOLD = 4;
    if (currentIndex >= videos.length - THRESHOLD) {
      console.log(`Near end of video list (index ${currentIndex} of ${videos.length}), loading more...`);
      loadNextPage();
    }
  }

  private handleMemoryWarning() {
    
    this.preloadedVideos.forEach(id => {
      if (id !== this.currentlyPlayingId) {
        const videoRef = this.videoRefs.get(id);
        if (videoRef && videoRef.current) {
          
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        }
      }
    });

    
    this.preloadedVideos = new Set(
      this.currentlyPlayingId ? [this.currentlyPlayingId] : []
    );

    
    if ('gc' in window) {
      (window as any).gc();
    }
  }

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
  cleanup() {
    this.videoStates.clear();
    this.videoMetadata.clear();
    this.manuallyPausedIds.clear();
    this.preloadedVideos.clear();
    this.visibleVideoIds.clear();

    this.currentlyPlayingId = null;
    this.lastActiveId = null;

    console.log('VideoPlaybackManager cleaned up');
  }
}

const videoPlaybackManager = new VideoPlaybackManager();
export default videoPlaybackManager;