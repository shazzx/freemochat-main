// WebCacheManager.tsx
// Web implementation of cache manager using Cache API or IndexedDB

class WebCacheManager {
  private initialized: boolean = false;
  private dbName: string = 'videoCacheDB';
  private storeName: string = 'videoCache';
  private db: IDBDatabase | null = null;
  private metrics = {
    hits: 0,
    misses: 0,
    prefetchSuccess: 0,
    prefetchFailed: 0
  };
  private pendingDownloads = new Map();
  private prefetchQueue: any[] = [];
  private activePrefetches: number = 0;
  private maxConcurrentPrefetches: number = 3;
  private isCacheSupportedPromise: Promise<boolean>;

  constructor() {
    // Check if Cache API is supported
    this.isCacheSupportedPromise = this.checkCacheSupport();
    this.initializeDB();
  }

  /**
   * Check if Cache API is supported
   */
  private async checkCacheSupport(): Promise<boolean> {
    return 'caches' in window;
  }

  /**
   * Initialize IndexedDB as fallback when Cache API isn't available
   */
  private async initializeDB() {
    const isCacheSupported = await this.isCacheSupportedPromise;
    
    if (isCacheSupported) {
      console.log('Using Cache API for video caching');
      this.initialized = true;
      return;
    }
    
    // Fallback to IndexedDB
    console.log('Cache API not supported, using IndexedDB fallback');
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBRequest).result;
        this.initialized = true;
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBRequest).error);
        reject(new Error('Failed to initialize IndexedDB'));
      };
    });
  }

  /**
   * Wait for initialization
   */
  private async waitForInitialization() {
    if (this.initialized) return;
    
    let attempts = 0;
    while (!this.initialized && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.initialized) {
      throw new Error('Cache initialization timed out');
    }
  }

  /**
   * Generate a cache key from URL
   */
  private generateCacheKey(url: string): string {
    // Create a hash from URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash) + url.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    hash = Math.abs(hash).toString(16);
    
    // Get the filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    
    return `${hash}_${fileName}`;
  }

  /**
   * Get a cached video
   */
  async getCachedVideo(url: string): Promise<{ uri: string, isCached: boolean }> {
    try {
      await this.waitForInitialization();
      const isCacheSupported = await this.isCacheSupportedPromise;
      
      if (isCacheSupported) {
        // Try Cache API
        const cache = await caches.open('video-cache');
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse && cachedResponse.ok) {
          this.metrics.hits++;
          console.log(`[CACHE HIT] Using cached video for ${url}`);
          
          // Create an object URL from the cached response
          const blob = await cachedResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          return {
            uri: objectUrl,
            isCached: true
          };
        }
      } else if (this.db) {
        // Try IndexedDB fallback
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction(this.storeName, 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.index('url').get(url);
          
          request.onsuccess = () => {
            const result = request.result;
            if (result && result.blob) {
              this.metrics.hits++;
              console.log(`[CACHE HIT] Using cached video from IndexedDB for ${url}`);
              
              const objectUrl = URL.createObjectURL(result.blob);
              resolve({
                uri: objectUrl,
                isCached: true
              });
            } else {
              this.metrics.misses++;
              resolve({
                uri: url,
                isCached: false
              });
            }
          };
          
          request.onerror = (event) => {
            console.error('Error reading from cache:', event);
            this.metrics.misses++;
            resolve({
              uri: url,
              isCached: false
            });
          };
        });
      }
      
      // Cache miss
      this.metrics.misses++;
      return {
        uri: url,
        isCached: false
      };
    } catch (error) {
      console.error('Error getting cached video:', error);
      return {
        uri: url,
        isCached: false
      };
    }
  }

  /**
   * Cache a video
   */
  async cacheVideo(url: string, highPriority: boolean = false): Promise<any> {
    try {
      await this.waitForInitialization();
      
      // Check if already being downloaded
      if (this.pendingDownloads.has(url)) {
        return this.pendingDownloads.get(url);
      }
      
      const downloadPromise = (async () => {
        try {
          const isCacheSupported = await this.isCacheSupportedPromise;
          
          if (isCacheSupported) {
            // Use Cache API
            const cache = await caches.open('video-cache');
            
            // Check if already cached
            const cachedResponse = await cache.match(url);
            if (cachedResponse && cachedResponse.ok) {
              this.metrics.hits++;
              const blob = await cachedResponse.blob();
              return {
                uri: URL.createObjectURL(blob),
                success: true,
                isCached: true
              };
            }
            
            // Cache the video
            console.log(`Caching video: ${url}${highPriority ? ' (high priority)' : ''}`);
            
            // Fetch with proper HTTP cache headers
            const response = await fetch(url, {
              method: 'GET',
              cache: 'force-cache',
              headers: {
                'Cache-Control': 'max-age=31536000' // 1 year
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
            
            // Clone and put in cache
            await cache.put(url, response.clone());
            
            // Create blob URL for immediate use
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            this.metrics.prefetchSuccess++;
            console.log(`Successfully cached video: ${url}`);
            
            return {
              uri: objectUrl,
              success: true,
              isCached: true
            };
          } else if (this.db) {
            // Use IndexedDB fallback
            // Check if already cached
            return new Promise((resolve, reject) => {
              const transaction = this.db!.transaction(this.storeName, 'readonly');
              const store = transaction.objectStore(this.storeName);
              const request = store.index('url').get(url);
              
              request.onsuccess = async () => {
                const result = request.result;
                if (result && result.blob) {
                  this.metrics.hits++;
                  resolve({
                    uri: URL.createObjectURL(result.blob),
                    success: true,
                    isCached: true
                  });
                } else {
                  // Cache the video
                  try {
                    const response = await fetch(url);
                    if (!response.ok) {
                      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
                    }
                    
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    
                    // Store in IndexedDB
                    const writeTransaction = this.db!.transaction(this.storeName, 'readwrite');
                    const writeStore = writeTransaction.objectStore(this.storeName);
                    
                    const writeRequest = writeStore.add({
                      id: this.generateCacheKey(url),
                      url: url,
                      blob: blob,
                      timestamp: Date.now(),
                      size: blob.size
                    });
                    
                    writeRequest.onsuccess = () => {
                      this.metrics.prefetchSuccess++;
                      console.log(`Successfully cached video in IndexedDB: ${url}`);
                      resolve({
                        uri: objectUrl,
                        success: true,
                        isCached: true
                      });
                    };
                    
                    writeRequest.onerror = (event) => {
                      console.error('Error writing to cache:', event);
                      this.metrics.prefetchFailed++;
                      resolve({
                        uri: url,
                        success: false,
                        isCached: false,
                        error: 'Failed to write to IndexedDB'
                      });
                    };
                  } catch (error) {
                    console.error('Error fetching video:', error);
                    this.metrics.prefetchFailed++;
                    resolve({
                      uri: url,
                      success: false,
                      isCached: false,
                      error: error.message
                    });
                  }
                }
              };
              
              request.onerror = (event) => {
                console.error('Error checking cache:', event);
                reject(new Error('Failed to check IndexedDB cache'));
              };
            });
          } else {
            // No caching available, just return the URL
            return {
              uri: url,
              success: false,
              isCached: false,
              error: 'No caching mechanism available'
            };
          }
        } catch (error) {
          console.error(`Error caching video ${url}:`, error);
          this.metrics.prefetchFailed++;
          return {
            uri: url,
            success: false,
            isCached: false,
            error: error.message
          };
        } finally {
          // Remove from pending downloads
          this.pendingDownloads.delete(url);
          
          // Process next item in queue
          this.activePrefetches--;
          this.processPrefetchQueue();
        }
      })();
      
      // Add to pending downloads
      this.pendingDownloads.set(url, downloadPromise);
      
      return downloadPromise;
    } catch (error) {
      console.error('Error in cacheVideo:', error);
      return {
        uri: url,
        success: false,
        isCached: false,
        error: error.message
      };
    }
  }

  /**
   * Add a video to the prefetch queue
   */
  queuePrefetch(url: string, priority: number = 10) {
    // Skip if already in queue
    if (this.prefetchQueue.some(item => item.url === url)) {
      return;
    }
    
    // Skip if already being downloaded
    if (this.pendingDownloads.has(url)) {
      return;
    }
    
    // Add to queue
    this.prefetchQueue.push({
      url,
      priority
    });
    
    // Sort queue by priority (lower number = higher priority)
    this.prefetchQueue.sort((a, b) => a.priority - b.priority);
    
    // Start processing queue if not already processing
    if (this.activePrefetches < this.maxConcurrentPrefetches) {
      this.processPrefetchQueue();
    }
  }

  /**
   * Process items in the prefetch queue
   */
  private processPrefetchQueue() {
    // Process until we hit the concurrent limit or run out of items
    while (
      this.prefetchQueue.length > 0 &&
      this.activePrefetches < this.maxConcurrentPrefetches
    ) {
      const nextItem = this.prefetchQueue.shift();
      if (!nextItem) continue;
      
      this.activePrefetches++;
      
      // Start prefetch
      this.cacheVideo(nextItem.url, nextItem.priority < 5)
        .catch(err => {
          console.error('Error during prefetch queue processing:', err);
        });
    }
  }

  /**
   * Prefetch multiple videos
   */
  prefetchVideos(videos: Array<{ url: string, priority: number }>) {
    if (!Array.isArray(videos) || videos.length === 0) return;
    
    // Add all videos to the queue
    videos.forEach(video => {
      if (video && video.url) {
        this.queuePrefetch(video.url, video.priority || 10);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    // This method will be called in the UI to show cache statistics
    return {
      fileCount: 0, // Will be populated by actual implementation
      totalSizeMB: '0',
      usagePercentage: '0',
      metrics: this.metrics,
      pendingDownloads: this.pendingDownloads.size,
      queuedPrefetches: this.prefetchQueue.length
    };
  }

  /**
   * Clear the cache
   */
  async clearCache() {
    try {
      const isCacheSupported = await this.isCacheSupportedPromise;
      
      if (isCacheSupported) {
        await caches.delete('video-cache');
        console.log('Cache cleared');
      } else if (this.db) {
        return new Promise<boolean>((resolve, reject) => {
          const transaction = this.db!.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();
          
          request.onsuccess = () => {
            console.log('IndexedDB cache cleared');
            resolve(true);
          };
          
          request.onerror = (event) => {
            console.error('Error clearing IndexedDB cache:', event);
            reject(new Error('Failed to clear IndexedDB cache'));
          };
        });
      }
      
      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        prefetchSuccess: 0,
        prefetchFailed: 0
      };
      
      // Clear pending downloads and queue
      this.pendingDownloads = new Map();
      this.prefetchQueue = [];
      this.activePrefetches = 0;
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
}

// Create and export singleton
const webCacheManager = new WebCacheManager();
export default webCacheManager;