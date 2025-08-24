# Image Caching System

This document explains the image caching system implemented in ZapAround iOS to eliminate the grey loading state and improve user experience.

## 🎯 Problem Solved

**Before**: Users saw a grey loading state for 1+ seconds every time they visited the homepage, even for images they've seen before.

**After**: Images load instantly from local cache, eliminating the grey loading state and providing a smooth user experience.

## 🏗️ Architecture

### Core Components

1. **`ImageCache` Class** (`src/utils/imageCache.ts`)
   - Manages image storage using Capacitor Preferences
   - Handles cache size limits (50MB max)
   - Automatic cleanup of old images (7-day expiration)
   - Base64 encoding for efficient storage

2. **Enhanced `OptimizedImage` Component** (`src/components/OptimizedImage.tsx`)
   - Integrates with caching system
   - Shows cached images immediately
   - Falls back to network loading if not cached
   - Automatic caching of new images

3. **Image Preloader Hooks** (`src/hooks/useImagePreloader.ts`)
   - Preloads critical images in background
   - Progress tracking for loading states
   - Specialized hooks for homepage and city images

4. **Cache Manager Component** (`src/components/ImageCacheManager.tsx`)
   - Shows cache statistics
   - Allows users to clear cache
   - Monitors cache health

## 🚀 Usage

### Basic Cached Image

```tsx
import { CachedImage } from '@/components/OptimizedImage';

<CachedImage
  src="/zaparound-uploads/city-image.jpg"
  alt="City view"
  width={800}
  height={600}
  fallback="/zaparound-uploads/defaultimage.png"
  enableCache={true}
/>
```

### Preloading Images

```tsx
import { useHomepageImagePreloader } from '@/hooks/useImagePreloader';

function HomePage() {
  const { isPreloading, progress } = useHomepageImagePreloader();
  
  return (
    <div>
      {isPreloading && <div>Preloading images: {progress}%</div>}
      {/* Your content */}
    </div>
  );
}
```

### Cache Management

```tsx
import { ImageCacheManager } from '@/components/ImageCacheManager';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <ImageCacheManager />
    </div>
  );
}
```

## 🔧 Configuration

### Capacitor Preferences

The system uses `@capacitor/preferences` which is already installed in your project. No additional setup required.

### Cache Settings

```typescript
// In src/utils/imageCache.ts
private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
```

## 📱 How It Works

### 1. First Visit
1. User visits homepage
2. Images load from network
3. Images are automatically cached to local storage
4. User sees images after loading

### 2. Subsequent Visits
1. User visits homepage
2. Images load instantly from local cache
3. No grey loading state
4. Smooth, instant experience

### 3. Cache Management
1. System monitors cache size
2. Automatically removes oldest images when limit reached
3. Expires images older than 7 days
4. Users can manually clear cache if needed

## 🎨 Components Updated

The following components now use the caching system:

- ✅ `CityTripsCarousel` - City images
- ✅ `LatestTripsCarousel` - Trip images  
- ✅ `FeaturedDestinationsPuzzle` - Destination images
- ✅ `EventCarousel` - Event images

## 📊 Performance Benefits

### Before (No Caching)
- **First load**: 1-3 seconds grey loading
- **Subsequent loads**: 1-2 seconds grey loading
- **Network usage**: Downloads same images repeatedly
- **User experience**: Frustrating loading delays

### After (With Caching)
- **First load**: 1-3 seconds (same as before)
- **Subsequent loads**: **0 seconds** - instant display
- **Network usage**: Downloads only new images
- **User experience**: Smooth, instant loading

## 🛠️ Technical Details

### Storage Method
- Uses Capacitor Preferences (native iOS storage)
- Base64 encoded images for compatibility
- Automatic size management and cleanup

### Cache Key Generation
- Hash-based keys to avoid special character issues
- Unique keys for each image URL
- Prefixed with `img_cache_` for easy identification

### Error Handling
- Graceful fallback to network loading
- Automatic retry mechanisms
- User-friendly error messages

## 🔍 Monitoring & Debugging

### Console Logs
The system logs important events:
```
[INFO] Image cached: /zaparound-uploads/city-image.jpg
[WARN] Failed to cache image: Network error
[INFO] Cache cleanup: Removed 5 old images
```

### Cache Statistics
Use the `ImageCacheManager` component to view:
- Total cached images
- Cache size usage
- Oldest/newest image dates
- Cache health status

## 🚨 Troubleshooting

### Common Issues

1. **Images still showing grey loading**
   - Check if caching is enabled (`enableCache={true}`)
   - Verify Capacitor Preferences plugin is working
   - Check console for error messages

2. **Cache not persisting**
   - Ensure app has proper permissions
   - Check iOS storage settings
   - Verify Capacitor sync completed

3. **Cache size issues**
   - Monitor cache statistics
   - Clear cache if needed
   - Check for memory leaks

### Debug Commands

```typescript
// Check cache status
import { getImageCacheStats } from '@/utils/imageCache';
const stats = await getImageCacheStats();
console.log('Cache stats:', stats);

// Clear cache manually
import { clearImageCache } from '@/utils/imageCache';
await clearImageCache();
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Progressive image loading (blur to sharp)
- [ ] Intelligent preloading based on user behavior
- [ ] Cache compression for better storage efficiency
- [ ] Offline-first image strategy
- [ ] Cache synchronization across devices

### Performance Optimizations
- [ ] WebP/AVIF format support
- [ ] Responsive image sizes
- [ ] Lazy loading with intersection observer
- [ ] Background cache warming

## 📚 Related Documentation

- [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [Progressive Web App Caching](https://web.dev/caching-strategies/)

## 🤝 Contributing

When adding new image components:

1. **Always use `CachedImage`** instead of regular `<img>` tags
2. **Set appropriate fallbacks** for error cases
3. **Enable caching** with `enableCache={true}`
4. **Test offline scenarios** to ensure cache works
5. **Monitor performance** with cache statistics

---

**Result**: Users now experience instant image loading on the homepage, eliminating the frustrating grey loading state and providing a premium, app-like experience.
