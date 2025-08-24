import { Preferences } from '@capacitor/preferences';

export interface CachedImage {
  data: string; // base64 encoded image
  timestamp: number;
  size: number;
  url: string;
}

export interface CacheStats {
  totalImages: number;
  totalSize: number;
  oldestImage: number;
  newestImage: number;
}

class ImageCache {
  private readonly CACHE_PREFIX = 'img_cache_';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly COMPRESSION_QUALITY = 0.8;

  /**
   * Get a cached image
   */
  async get(url: string): Promise<string | null> {
    try {
      const key = this.getCacheKey(url);
      const { value } = await Preferences.get({ key });
      
      if (!value) return null;
      
      const cached: CachedImage = JSON.parse(value);
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > this.MAX_AGE) {
        await this.remove(url);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.warn('Failed to get cached image:', error);
      return null;
    }
  }

  /**
   * Cache an image
   */
  async set(url: string, imageBlob: Blob): Promise<void> {
    try {
      // Convert blob to base64
      const base64 = await this.blobToBase64(imageBlob);
      
      const cached: CachedImage = {
        data: base64,
        timestamp: Date.now(),
        size: imageBlob.size,
        url
      };

      // Check cache size and clean if necessary
      await this.cleanupCache();
      
      const key = this.getCacheKey(url);
      await Preferences.set({
        key,
        value: JSON.stringify(cached)
      });
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }
  }

  /**
   * Check if an image is cached
   */
  async has(url: string): Promise<boolean> {
    try {
      const key = this.getCacheKey(url);
      const { value } = await Preferences.get({ key });
      
      if (!value) return false;
      
      const cached: CachedImage = JSON.parse(value);
      return Date.now() - cached.timestamp <= this.MAX_AGE;
    } catch {
      return false;
    }
  }

  /**
   * Remove a specific cached image
   */
  async remove(url: string): Promise<void> {
    try {
      const key = this.getCacheKey(url);
      await Preferences.remove({ key });
    } catch (error) {
      console.warn('Failed to remove cached image:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clear(): Promise<void> {
    try {
      const keys = await Preferences.keys();
      const imageKeys = keys.keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      for (const key of imageKeys) {
        await Preferences.remove({ key });
      }
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const keys = await Preferences.keys();
      const imageKeys = keys.keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      let oldestImage = Date.now();
      let newestImage = 0;
      
      for (const key of imageKeys) {
        const { value } = await Preferences.get({ key });
        if (value) {
          const cached: CachedImage = JSON.parse(value);
          totalSize += cached.size;
          oldestImage = Math.min(oldestImage, cached.timestamp);
          newestImage = Math.max(newestImage, cached.timestamp);
        }
      }
      
      return {
        totalImages: imageKeys.length,
        totalSize,
        oldestImage,
        newestImage
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        totalImages: 0,
        totalSize: 0,
        oldestImage: 0,
        newestImage: 0
      };
    }
  }

  /**
   * Clean up cache based on size and age
   */
  private async cleanupCache(): Promise<void> {
    try {
      const stats = await this.getStats();
      
      if (stats.totalSize <= this.MAX_CACHE_SIZE) return;
      
      // Get all cached images sorted by timestamp (oldest first)
      const keys = await Preferences.keys();
      const imageKeys = keys.keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      const images: Array<{ key: string; cached: CachedImage }> = [];
      
      for (const key of imageKeys) {
        const { value } = await Preferences.get({ key });
        if (value) {
          const cached: CachedImage = JSON.parse(value);
          images.push({ key, cached });
        }
      }
      
      // Sort by timestamp (oldest first)
      images.sort((a, b) => a.cached.timestamp - b.cached.timestamp);
      
      // Remove oldest images until we're under the limit
      let currentSize = stats.totalSize;
      for (const { key, cached } of images) {
        if (currentSize <= this.MAX_CACHE_SIZE) break;
        
        await Preferences.remove({ key });
        currentSize -= cached.size;
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 to blob
   */
  base64ToBlob(base64: string): Blob {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const data = parts[1];
    
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  /**
   * Generate cache key for URL
   */
  private getCacheKey(url: string): string {
    // Create a hash of the URL to avoid issues with special characters
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${this.CACHE_PREFIX}${Math.abs(hash)}`;
  }

  /**
   * Preload images for better UX
   */
  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.preloadSingle(url));
    await Promise.allSettled(promises);
  }

  /**
   * Preload a single image
   */
  private async preloadSingle(url: string): Promise<void> {
    if (await this.has(url)) return;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        await this.set(url, blob);
      }
    } catch (error) {
      console.warn('Failed to preload image:', url, error);
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

// Export utility functions
export const preloadImages = (urls: string[]) => imageCache.preload(urls);
export const getCachedImage = (url: string) => imageCache.get(url);
export const cacheImage = (url: string, blob: Blob) => imageCache.set(url, blob);
export const isImageCached = (url: string) => imageCache.has(url);
export const clearImageCache = () => imageCache.clear();
export const getImageCacheStats = () => imageCache.getStats();
