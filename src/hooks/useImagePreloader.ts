import { useEffect, useCallback, useState } from 'react';
import { preloadImages, getImageCacheStats } from '@/utils/imageCache';

interface UseImagePreloaderOptions {
  urls: string[];
  priority?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface PreloadStatus {
  isPreloading: boolean;
  progress: number;
  total: number;
  loaded: number;
  errors: string[];
}

export function useImagePreloader({
  urls,
  priority = false,
  onProgress,
  onComplete,
  onError,
}: UseImagePreloaderOptions) {
  const [status, setStatus] = useState<PreloadStatus>({
    isPreloading: false,
    progress: 0,
    total: urls.length,
    loaded: 0,
    errors: [],
  });

  const preload = useCallback(async () => {
    if (urls.length === 0) return;

    setStatus(prev => ({ ...prev, isPreloading: true, errors: [] }));

    try {
      // Start preloading
      await preloadImages(urls);
      
      // Update status
      setStatus(prev => ({
        ...prev,
        isPreloading: false,
        loaded: urls.length,
        progress: 100,
      }));

      onComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(prev => ({
        ...prev,
        isPreloading: false,
        errors: [...prev.errors, errorMessage],
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [urls, onComplete, onError]);

  // Auto-preload if priority is true
  useEffect(() => {
    if (priority && urls.length > 0) {
      preload();
    }
  }, [priority, urls, preload]);

  // Progress tracking
  useEffect(() => {
    if (status.loaded > 0) {
      const progress = Math.round((status.loaded / status.total) * 100);
      setStatus(prev => ({ ...prev, progress }));
      onProgress?.(status.loaded, status.total);
    }
  }, [status.loaded, status.total, onProgress]);

  const getCacheStats = useCallback(async () => {
    return await getImageCacheStats();
  }, []);

  return {
    ...status,
    preload,
    getCacheStats,
    reset: () => setStatus({
      isPreloading: false,
      progress: 0,
      total: urls.length,
      loaded: 0,
      errors: [],
    }),
  };
}

// Hook for preloading specific image types
export function useHomepageImagePreloader() {
  const homepageImages = [
    '/zaparound-uploads/defaultimage.png',
    '/zaparound-uploads/background1.webp',
    '/zaparound-uploads/background2.webp',
    // Add more homepage images here
  ];

  return useImagePreloader({
    urls: homepageImages,
    priority: true,
    onComplete: () => console.log('Homepage images preloaded'),
    onError: (error) => console.warn('Failed to preload homepage images:', error),
  });
}

// Hook for preloading city images
export function useCityImagePreloader(cityNames: string[]) {
  const cityImageUrls = cityNames.map(city => 
    `/zaparound-uploads/city-images/${city.toLowerCase().replace(/\s+/g, '-')}.jpg`
  );

  return useImagePreloader({
    urls: cityImageUrls,
    priority: false,
    onComplete: () => console.log('City images preloaded'),
    onError: (error) => console.warn('Failed to preload city images:', error),
  });
}
