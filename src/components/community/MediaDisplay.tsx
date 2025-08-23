import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaItem } from '@/types/community';

interface MediaDisplayProps {
  media: MediaItem[] | string; // Can be array of media items or legacy image_url string
  className?: string;
  maxPreview?: number;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  className,
  maxPreview = 5
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [orientationById, setOrientationById] = useState<Record<string, 'portrait' | 'landscape' | 'square'>>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  // Touch swipe refs for mobile navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isSwipingRef = useRef<boolean>(false);

  // Handle both new media_urls array and old image_url string
  let allMedia: MediaItem[] = [];
  
  if (Array.isArray(media)) {
    // New format: array of media items
    allMedia = media;
  } else if (typeof media === 'string' && media.trim() !== '') {
    // Old format: single image URL string
    allMedia = [{ id: 'legacy-image', url: media, type: 'image' as const }];
  }

  if (!allMedia || allMedia.length === 0) return null;

  const handleMediaClick = (index: number) => {
    setSelectedIndex(index);
    // Stop any playing videos when opening gallery
    setPlayingVideo(null);
  };

  const closeGallery = () => {
    setSelectedIndex(null);
    setPlayingVideo(null);
  };

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    
    const newIndex = direction === 'prev' 
      ? (selectedIndex - 1 + allMedia.length) % allMedia.length
      : (selectedIndex + 1) % allMedia.length;
    
    setSelectedIndex(newIndex);
    setPlayingVideo(null);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (allMedia.length <= 1) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isSwipingRef.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe detected
      isSwipingRef.current = true;
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50;
    if (horizontal) {
      navigateGallery(deltaX > 0 ? 'prev' : 'next');
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isSwipingRef.current = false;
  };

  const toggleVideoPlayback = (mediaId: string) => {
    setPlayingVideo(playingVideo === mediaId ? null : mediaId);
  };

  const getContainerLayoutClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2 grid-rows-2'; // Facebook-like: 1 tall on left, 2 stacked on right
    if (count === 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-3 grid-rows-2'; // 5+: 3 columns with first tile emphasized
  };

  const getItemLayoutClass = (index: number, count: number, item: MediaItem) => {
    const orientation = orientationById[item.id] || (item.type === 'video' ? 'landscape' : undefined);

    // Base tile styles
    let classes = [
      'relative',
      'group',
      'overflow-hidden',
      'rounded-lg',
      'bg-gray-100',
      'cursor-pointer',
      'w-full',
      'h-full',
    ];

    // Aspect ratio per configuration
    if (count === 1) {
      classes.push(orientation === 'portrait' ? 'aspect-[4/5]' : orientation === 'square' ? 'aspect-square' : 'aspect-video');
    } else if (count === 2) {
      // Keep side-by-side consistent yet orientation-aware
      classes.push(orientation === 'portrait' ? 'aspect-[4/5]' : 'aspect-[4/3]');
    } else if (count === 3) {
      // Facebook style: first item tall on the left (spans 2 rows), two stacked on right
      if (index === 0) {
        classes.push('row-span-2');
        classes.push(orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]');
      } else {
        classes.push('aspect-square');
      }
    } else if (count === 4) {
      classes.push('aspect-square');
    } else {
      // 5+ images: first tile emphasized spanning 2x2, others fill
      if (index === 0) {
        classes.push('col-span-2', 'row-span-2');
        classes.push(orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-video');
      } else {
        classes.push('aspect-square');
      }
    }

    return classes.join(' ');
  };

  const handleImageLoad = (id: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    if (!naturalWidth || !naturalHeight) return;
    const ratio = naturalWidth / naturalHeight;
    const orientation: 'portrait' | 'landscape' | 'square' = ratio === 1 ? 'square' : ratio > 1 ? 'landscape' : 'portrait';
    setOrientationById((prev) => (prev[id] ? prev : { ...prev, [id]: orientation }));
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    const isPlaying = playingVideo === item.id;
    const isVideo = item.type === 'video';
    
    return (
      <div
        key={item.id}
        className={getItemLayoutClass(index, Math.min(allMedia.length, maxPreview), item)}
        onClick={() => handleMediaClick(index)}
      >
        {isVideo ? (
          <video
            ref={(el) => {
              videoRefs.current[item.id] = el;
            }}
            src={item.url}
            poster={item.thumbnail}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            onPlay={() => setPlayingVideo(item.id)}
            onPause={() => setPlayingVideo(null)}
          />
        ) : (
          <img
            src={item.url}
            alt="Media content"
            className="w-full h-full object-cover"
            onLoad={handleImageLoad(item.id)}
          />
        )}
        
        {/* Overlay with controls */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          {isVideo && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 hover:bg-white/30 text-white"
              onClick={(e) => {
                e.stopPropagation();
                toggleVideoPlayback(item.id);
              }}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Video indicator */}
        {isVideo && (
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Play className="h-3 w-3" />
            VIDEO
          </div>
        )}
        
        {/* Show more indicator for last item */}
        {index === maxPreview - 1 && allMedia.length > maxPreview && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg font-bold">+{allMedia.length - maxPreview}</p>
              <p className="text-sm">more</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGalleryItem = (item: MediaItem, index: number) => {
    const isPlaying = playingVideo === item.id;
    const isVideo = item.type === 'video';
    
    return (
      <div
        key={item.id}
        className="relative w-full h-full flex items-center justify-center"
      >
        {isVideo ? (
          <video
            ref={(el) => {
              videoRefs.current[item.id] = el;
            }}
            src={item.url}
            poster={item.thumbnail}
            className="block max-w-[100svw] max-h-[100svh] w-auto h-auto object-contain"
            controls
            autoPlay={isPlaying}
            onPlay={() => setPlayingVideo(item.id)}
            onPause={() => setPlayingVideo(null)}
          />
        ) : (
          <img
            src={item.url}
            alt="Media content"
            className="block max-w-[100svw] max-h-[100svh] w-auto h-auto object-contain"
            draggable={false}
          />
        )}
        
        {/* Gallery controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/50 hover:bg-black/70 text-white"
            onClick={() => {
              const link = document.createElement('a');
              link.href = item.url;
              link.download = `media-${index + 1}`;
              link.click();
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/50 hover:bg-black/70 text-white"
            onClick={() => {
              if (isVideo) {
                toggleVideoPlayback(item.id);
              } else {
                window.open(item.url, '_blank');
              }
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const displayMedia = allMedia.slice(0, maxPreview);

  return (
    <>
      <div
        className={cn(
          // Grid with consistent row heights for Facebook-like stacking
          "grid gap-2 auto-rows-[120px] sm:auto-rows-[160px]",
          getContainerLayoutClass(displayMedia.length),
          className
        )}
      >
        {displayMedia.map((item, index) => renderMediaItem(item, index))}
      </div>

      {/* Gallery Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeGallery}>
        <DialogContent className="max-w-none w-screen h-[100dvh] p-0 bg-black sm:bg-[#fcfcfc] border-0 shadow-none rounded-none overflow-hidden">
          <div
            className="relative w-full h-full flex items-center justify-center bg-black"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-black/70 text-white"
            onClick={closeGallery}
          >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Navigation buttons */}
            {allMedia.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 left-4 z-10 bg-black/60 hover:bg-black/70 text-white transform -translate-y-1/2"
                  onClick={() => navigateGallery('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 right-4 z-10 bg-black/60 hover:bg-black/70 text-white transform -translate-y-1/2"
                  onClick={() => navigateGallery('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Current media */}
            {selectedIndex !== null && renderGalleryItem(allMedia[selectedIndex], selectedIndex)}
            
            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex !== null ? selectedIndex + 1 : 0} / {allMedia.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 