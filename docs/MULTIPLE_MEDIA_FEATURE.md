# Multiple Media Upload Feature

## Overview

The Community feature now supports multiple image and video uploads with a Facebook-like layout and gallery functionality.

## Features

### Media Upload
- **Multiple Files**: Upload up to 10 images/videos per post
- **File Types**: Supports JPEG, PNG, GIF images and MP4, MOV, AVI videos
- **File Size Limits**: 
  - Images: 10MB max per file
  - Videos: 50MB max per file
- **Preview**: Real-time preview with grid layout
- **Video Controls**: Play/pause videos in preview
- **Remove Files**: Individual file removal before posting

### Media Display
- **Smart Layout**: Facebook-like grid layout that adapts to number of media files
- **Gallery View**: Full-screen gallery with navigation
- **Video Playback**: Inline video playback without fullscreen
- **Download**: Download individual media files
- **Responsive**: Works on desktop and mobile

### Layout Patterns
- **1 Media**: Full width, aspect-video
- **2 Media**: Side-by-side, aspect-video
- **3 Media**: 2x1 grid with first item larger
- **4 Media**: 2x2 grid
- **5+ Media**: 3x2 grid with "show more" indicator

## Database Schema

### New Columns
- `community_posts.media_urls` (JSONB): Array of media objects
- `post_replies.media_urls` (JSONB): Array of media objects

### Media Object Structure
```json
{
  "id": "unique-id",
  "url": "https://storage-url.com/file.jpg",
  "type": "image|video",
  "thumbnail": "https://storage-url.com/thumbnail.jpg" // optional, for videos
}
```

## Components

### MediaUpload
- Handles file selection and validation
- Provides preview grid
- Manages file state

### MediaDisplay
- Renders media in posts and replies
- Provides gallery functionality
- Handles video playback

## Usage

### In Posts
```tsx
<MediaUpload
  onMediaChange={handleMediaChange}
  maxFiles={10}
  disabled={isUploading}
/>
```

### In Display
```tsx
<MediaDisplay
  media={post.media_urls}
  maxPreview={5}
/>
```

## Migration

Run the database migration to add the new columns:
```bash
npx supabase db push
```

## Backward Compatibility

The system maintains backward compatibility with the old `image_url` field while supporting the new `media_urls` array.

## File Storage

Media files are stored in the `community-images` Supabase storage bucket with the following naming convention:
```
{user_id}_{timestamp}_{random}.{extension}
```

## Security

- File type validation on both client and server
- File size limits enforced
- User authentication required for uploads
- Row Level Security (RLS) policies in place 