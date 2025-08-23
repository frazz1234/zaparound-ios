import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'dominantColor';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  webp?: boolean;
  avif?: boolean;
  responsive?: boolean;
  aspectRatio?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  loading = 'lazy',
  sizes = '100vw',
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallback,
  webp = true,
  avif = false,
  responsive = true,
  aspectRatio,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URLs
  const generateImageUrls = useCallback(() => {
    const baseUrl = src.startsWith('http') ? src : `https://zaparound.com${src}`;
    const url = new URL(baseUrl);
    
    // Add optimization parameters
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality) url.searchParams.set('q', quality.toString());
    
    const urls: { [key: string]: string } = {
      default: url.toString(),
    };

    // Generate WebP version if supported
    if (webp) {
      const webpUrl = new URL(baseUrl);
      if (width) webpUrl.searchParams.set('w', width.toString());
      if (height) webpUrl.searchParams.set('h', height.toString());
      if (quality) webpUrl.searchParams.set('q', quality.toString());
      webpUrl.searchParams.set('fm', 'webp');
      urls.webp = webpUrl.toString();
    }

    // Generate AVIF version if supported
    if (avif) {
      const avifUrl = new URL(baseUrl);
      if (width) avifUrl.searchParams.set('w', width.toString());
      if (height) avifUrl.searchParams.set('h', height.toString());
      if (quality) avifUrl.searchParams.set('q', quality.toString());
      avifUrl.searchParams.set('fm', 'avif');
      urls.avif = avifUrl.toString();
    }

    return urls;
  }, [src, width, height, quality, webp, avif]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate responsive sizes
  const generateSizes = useCallback(() => {
    if (!responsive) return sizes;
    
    if (width && width <= 640) {
      return '(max-width: 640px) 100vw, 50vw';
    } else if (width && width <= 1024) {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    } else {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
    }
  }, [responsive, sizes, width]);

  const imageUrls = generateImageUrls();
  const responsiveSizes = generateSizes();

  // Container styles for aspect ratio
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && {
      aspectRatio: aspectRatio.toString(),
    }),
    // Only set explicit width/height if no className is provided (non-responsive usage)
    ...(width && height && !aspectRatio && !className && {
      width: `${width}px`,
      height: `${height}px`,
    }),
  };

  // Image styles
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  return (
    <div className={cn('relative', className)} style={containerStyle}>
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          style={{ filter: 'blur(10px)' }}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Optimized image */}
      {isInView && (
        <picture>
          {/* AVIF format */}
          {avif && imageUrls.avif && (
            <source srcSet={imageUrls.avif} type="image/avif" />
          )}
          
          {/* WebP format */}
          {webp && imageUrls.webp && (
            <source srcSet={imageUrls.webp} type="image/webp" />
          )}
          
          {/* Fallback image */}
          <img
            ref={imgRef}
            src={hasError && fallback ? fallback : imageUrls.default}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            sizes={responsiveSizes}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={imageStyle}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            {...(priority && { fetchpriority: 'high' as const })}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Export a simpler version for basic use cases
export const Image: React.FC<Omit<OptimizedImageProps, 'format' | 'fit' | 'position' | 'placeholder' | 'priority' | 'sizes' | 'srcSet'>> = (props) => {
  return <OptimizedImage {...props} />;
};

// Export a hero image component for above-the-fold images
export const HeroImage: React.FC<OptimizedImageProps> = (props) => {
  return <OptimizedImage {...props} priority loading="eager" />;
};

// Export a lazy image component for below-the-fold images
export const LazyImage: React.FC<OptimizedImageProps> = (props) => {
  return <OptimizedImage {...props} loading="lazy" />;
}; 