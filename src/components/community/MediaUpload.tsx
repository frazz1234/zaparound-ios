import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ImageIcon, Video, X, Plus, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaFile } from '@/types/community';

interface MediaUploadProps {
  onMediaChange: (media: MediaFile[]) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaChange,
  maxFiles = 10,
  className,
  disabled = false
}) => {
  const { t } = useTranslation('community');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (mediaFiles.length + files.length > maxFiles) {
      alert(t('media.maxFilesExceeded', { max: maxFiles }));
      return;
    }

    const newMediaFiles: MediaFile[] = [];

    files.forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(t('media.invalidFileType', { filename: file.name }));
        return;
      }

      // Validate file size (max 50MB for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t(isVideo ? 'media.fileTooLargeVideo' : 'media.fileTooLargeImage', { filename: file.name }));
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      
      newMediaFiles.push({
        id,
        file,
        preview,
        type: isImage ? 'image' : 'video'
      });
    });

    const updatedMedia = [...mediaFiles, ...newMediaFiles];
    setMediaFiles(updatedMedia);
    onMediaChange(updatedMedia);
  };

  const removeMedia = (id: string) => {
    const updatedMedia = mediaFiles.filter(media => media.id !== id);
    setMediaFiles(updatedMedia);
    onMediaChange(updatedMedia);
    
    // Stop video if it was playing
    if (playingVideo === id) {
      setPlayingVideo(null);
    }
  };

  const toggleVideoPlayback = (id: string) => {
    setPlayingVideo(playingVideo === id ? null : id);
  };

  const getLayoutClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-3 grid-rows-2';
  };

  const renderMediaPreview = (media: MediaFile, index: number) => {
    const isPlaying = playingVideo === media.id;
    
    return (
      <div
        key={media.id}
        className={cn(
          "relative group overflow-hidden rounded-lg bg-gray-100",
          mediaFiles.length === 1 ? "aspect-video" : "aspect-square",
          mediaFiles.length === 2 ? "aspect-video" : "",
          mediaFiles.length === 3 && index === 0 ? "col-span-2 row-span-2 aspect-video" : "",
          mediaFiles.length === 4 ? "aspect-square" : "",
          mediaFiles.length > 4 && index === 0 ? "col-span-2 row-span-2 aspect-video" : ""
        )}
      >
        {media.type === 'image' ? (
          <img
            src={media.preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={media.preview}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            ref={(el) => {
              if (el) {
                if (isPlaying) {
                  el.play().catch(() => {});
                } else {
                  el.pause();
                }
              }
            }}
          />
        )}
        
        {/* Overlay with controls */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          {media.type === 'video' && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 hover:bg-white/30 text-white"
              onClick={() => toggleVideoPlayback(media.id)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white h-6 w-6 p-0"
          onClick={() => removeMedia(media.id)}
        >
          <X className="h-3 w-3" />
        </Button>
        
        {/* File type indicator */}
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {media.type === 'video' ? t('media.video') : t('media.image')}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload button */}
      {mediaFiles.length < maxFiles && (
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('media.addPhotosVideos')}</span>
        </Button>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />
      
      {/* Media preview grid */}
      {mediaFiles.length > 0 && (
        <div className={cn(
          "grid gap-2",
          getLayoutClass(mediaFiles.length)
        )}>
          {mediaFiles.map((media, index) => renderMediaPreview(media, index))}
          
          {/* Show more indicator */}
          {mediaFiles.length > 5 && (
            <div className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    {t('media.moreFiles', { count: mediaFiles.length - 5 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* File count indicator */}
      {mediaFiles.length > 0 && (
        <p className="text-sm text-gray-500">
          {t('media.filesSelected', { count: mediaFiles.length, max: maxFiles })}
        </p>
      )}
    </div>
  );
}; 