# Location Images Feature (DEPRECATED)

This document explains the **deprecated** location images feature in the ZapAround application.

## ⚠️ Important Notice

**The city-images functionality has been removed from the build process.** This feature has been deprecated in favor of using a single default image (`/zaparound-uploads/defaultimage.png`) for all locations.

## Previous Implementation (No Longer Active)

The location images feature previously downloaded high-quality images of cities, states/provinces, and countries at build time and served them statically for improved SEO and performance. This approach ensured that:

1. Images were optimized and compressed
2. Images were served statically for better SEO
3. Images had proper alt tags for accessibility
4. Images used lazy loading for performance
5. The application had multi-level fallbacks for missing images

### Previous Build-Time Image Download

The `download-city-images.ts` script in the `scripts` directory previously downloaded images from Pexels using their API. This script:

- Ran during the build process (`npm run build`)
- Downloaded images for predefined lists of cities, states/provinces, and countries
- Saved them to `/public/city-images/` with the location name as the filename
- Skipped locations that already had images downloaded
- Used concurrency limiting to avoid overwhelming the Pexels API

### Previous Location Image Usage in Components

The main component that used these location images was:

1. **LatestTripsCarousel**: Used location images based on the trip's location details

## Current Implementation

All components now use the default image located at `/zaparound-uploads/defaultimage.png` for any location that doesn't have a custom image URL specified.

### Benefits of This Change

1. **Simplified Build Process**: No more image downloads during build
2. **Reduced Build Time**: Faster builds without image processing
3. **Consistent UI**: All locations use the same default image
4. **Reduced Storage**: No need to store hundreds of city images
5. **Better Performance**: No image processing overhead

## Migration Notes

If you were previously using city-specific images, you should:

1. Update any hardcoded references to `/city-images/` paths
2. Use the default image path: `/zaparound-uploads/defaultimage.png`
3. Consider implementing custom image URLs in your data if specific images are needed

## Future Improvements

If you need location-specific images in the future, consider:

1. Using external image APIs (like Google Places Photos)
2. Implementing a CDN-based solution
3. Using dynamic image generation services
4. Storing custom image URLs in your database 