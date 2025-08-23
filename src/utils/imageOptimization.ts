/**
 * Image optimization utilities for ZapAround
 * Reduces Fast Data Transfer costs by optimizing image delivery
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  background?: string;
  blur?: number;
  sharpen?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
  gamma?: number;
  grayscale?: boolean;
  flip?: 'horizontal' | 'vertical' | 'both';
  flop?: boolean;
  rotate?: number;
  tint?: string;
  negate?: boolean;
  normalise?: boolean;
  median?: number;
  modulate?: {
    brightness?: number;
    saturation?: number;
    hue?: number;
  };
}

/**
 * Generate optimized image URL for mobile app
 */
export const getOptimizedImageUrl = (
  src: string,
  options: ImageOptimizationOptions = {}
): string => {
  // For mobile apps, return the original source
  // Image optimization can be handled by the native image components
  return src;
};

/**
 * Get responsive image sizes for different screen sizes
 */
export const getResponsiveSizes = (baseWidth: number = 1200): string => {
  return `(max-width: 640px) ${Math.min(baseWidth, 640)}px, (max-width: 768px) ${Math.min(baseWidth, 768)}px, (max-width: 1024px) ${Math.min(baseWidth, 1024)}px, ${baseWidth}px`;
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (
  src: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920],
  format: 'webp' | 'avif' | 'jpeg' = 'webp'
): string => {
  return widths
    .map(width => `${getOptimizedImageUrl(src, { width, format })} ${width}w`)
    .join(', ');
};

/**
 * Get optimal image format based on browser support
 */
export const getOptimalFormat = (): 'webp' | 'avif' | 'jpeg' => {
  // Check for AVIF support
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const blob = new Blob([data], { type: 'image/avif' });
      if (createImageBitmap) {
        return 'avif';
      }
    }
  }
  
  // Check for WebP support
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg';
  }
  
  return 'jpeg';
};

/**
 * Lazy loading hook for images
 */
export const useLazyImage = (src: string, options: ImageOptimizationOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    if (!src) return;

    const optimizedSrc = getOptimizedImageUrl(src, options);
    setCurrentSrc(optimizedSrc);
    setIsLoaded(false);
    setError(false);

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
    img.src = optimizedSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, JSON.stringify(options)]);

  return { isLoaded, error, currentSrc };
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string, options: ImageOptimizationOptions = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = getOptimizedImageUrl(src, options);
  });
};

/**
 * Batch preload images
 */
export const preloadImages = async (images: Array<{ src: string; options?: ImageOptimizationOptions }>): Promise<void> => {
  const promises = images.map(({ src, options }) => preloadImage(src, options));
  await Promise.allSettled(promises);
};

/**
 * Get image dimensions from URL or file
 */
export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Failed to get dimensions for: ${src}`));
    img.src = src;
  });
};

/**
 * Calculate aspect ratio
 */
export const getAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Get optimal image size based on container and device
 */
export const getOptimalImageSize = (
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = 1
): { width: number; height: number } => {
  const targetWidth = Math.round(containerWidth * devicePixelRatio);
  const targetHeight = Math.round(containerHeight * devicePixelRatio);
  
  // Round to nearest 100 for better caching
  return {
    width: Math.round(targetWidth / 100) * 100,
    height: Math.round(targetHeight / 100) * 100
  };
};

// Import React hooks
import { useState, useEffect } from 'react'; 