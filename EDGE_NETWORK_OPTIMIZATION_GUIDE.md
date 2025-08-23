# Vercel Edge Network Optimization Guide for ZapAround

## Overview

This guide explains how to optimize your ZapAround project to reduce Vercel Edge Network costs and improve performance. Based on the [Vercel Edge Network documentation](https://vercel.com/docs/edge-network/manage-usage#edge-requests), here are the key metrics and optimization strategies.

## Key Metrics to Monitor

### 1. Edge Requests
- **What it is**: Every request to your site (static assets, API calls, page loads)
- **Current Pricing**: 
  - Hobby: First 1,000,000 requests included
  - Pro: First 10,000,000 requests included
  - Pro Extra: $2.00 per 1,000,000 requests

### 2. Fast Data Transfer
- **What it is**: Data transferred to/from Vercel's Edge Network
- **Current Pricing**:
  - Hobby: First 100 GB included
  - Pro: First 1 TB included
  - Pro Extra: $0.06 per 1 GB

### 3. Fast Origin Transfer
- **What it is**: Data transfer when using compute (Supabase Edge Functions)
- **Current Pricing**:
  - Hobby: First 10 GB included
  - Pro: First 100 GB included
  - Pro Extra: $0.06 per 1 GB

### 4. Edge Request CPU Duration
- **What it is**: CPU processing time for requests
- **Current Pricing**: Free for requests ≤10ms, $0.30 per hour for additional CPU time

## Current Optimizations in ZapAround

### ✅ Already Implemented

1. **Bundle Splitting** (`vite.config.ts`)
   - Manual chunk splitting for vendor libraries
   - Feature-based code splitting
   - Optimized chunk file names

2. **Image Optimization**
   - Lazy loading implemented
   - Proper image sizing
   - WebP format support

3. **Caching Strategy**
   - Service Worker with smart caching
   - PWA implementation
   - Cache-first for static assets

4. **Lazy Loading**
   - Non-critical routes loaded on demand
   - Component-level lazy loading

## New Optimizations Implemented

### 1. Enhanced Vercel Configuration (`vercel.json`)

```json
{
  "images": {
    "sizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    "domains": ["zaparound.com", "www.zaparound.com"],
    "formats": ["image/webp", "image/avif"],
    "minimumCacheTTL": 86400
  }
}
```

**Benefits**:
- Automatic image optimization
- Multiple format support (WebP, AVIF)
- Responsive image sizes
- 24-hour cache TTL

### 2. Image Optimization Utilities (`src/utils/imageOptimization.ts`)

**Features**:
- Dynamic format detection (AVIF → WebP → JPEG)
- Responsive image generation
- Lazy loading hooks
- Preloading utilities

**Usage**:
```typescript
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/zaparound-uploads/hero.jpg"
  alt="Hero image"
  width={1200}
  height={675}
  quality={85}
  priority={true}
/>
```

### 3. Enhanced Caching Headers

```json
{
  "source": "/zaparound-uploads/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=604800, stale-while-revalidate=86400"
    }
  ]
}
```

**Benefits**:
- 7-day cache for uploads
- Stale-while-revalidate for better UX
- Reduced repeat requests

## Additional Optimization Recommendations

### 1. API Route Optimization

**Current Issue**: Multiple Supabase Edge Functions
**Solution**: Consolidate similar functions

```typescript
// Instead of separate functions for each email type
// Create one email function with type parameter
const emailTypes = {
  contact: ContactEmailTemplate,
  business: BusinessEmailTemplate,
  password: PasswordEmailTemplate
};
```

### 2. Image Strategy Optimization

**Replace existing image usage**:
```typescript
// Before
<img src="/zaparound-uploads/image.jpg" alt="Description" />

// After
import { OptimizedImage } from '@/components/OptimizedImage';

<OptimizedImage
  src="/zaparound-uploads/image.jpg"
  alt="Description"
  width={800}
  height={600}
  quality={85}
/>
```

### 3. Bundle Size Optimization

**Monitor bundle sizes**:
```bash
npm run build
# Check dist/stats.html for bundle analysis
```

**Target bundle sizes**:
- Initial JS: < 200KB
- CSS: < 50KB
- Images: < 500KB total

### 4. API Response Optimization

**Reduce response sizes**:
```typescript
// Before: Return full objects
return { user: fullUserObject, metadata: {...} };

// After: Return only needed fields
return { 
  id: user.id, 
  name: user.name,
  email: user.email 
};
```

### 5. Caching Strategy Enhancement

**Implement stale-while-revalidate**:
```typescript
// API routes
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
    }
  });
}
```

## Monitoring and Analytics

### 1. Vercel Analytics
- Monitor Edge Requests in real-time
- Track Fast Data Transfer usage
- Analyze request patterns

### 2. Performance Monitoring
```typescript
// Add to critical pages
import { onCLS, onFID, onLCP } from 'web-vitals';

useEffect(() => {
  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
}, []);
```

### 3. Bundle Analysis
```bash
# Regular bundle analysis
npm run build
open dist/stats.html
```

## Cost Optimization Strategies

### 1. Image Optimization Priority
1. **Hero Images**: Use `priority={true}` for above-the-fold
2. **Gallery Images**: Use lazy loading with intersection observer
3. **Thumbnails**: Use smaller sizes and WebP format

### 2. API Route Consolidation
- Combine similar functions
- Use query parameters instead of separate routes
- Implement proper caching headers

### 3. Static Asset Optimization
- Use CDN for large files
- Implement proper cache headers
- Compress assets (gzip, brotli)

### 4. Database Query Optimization
- Use Supabase query optimization
- Implement connection pooling
- Cache frequently accessed data

## Implementation Checklist

### Phase 1: Image Optimization (High Impact)
- [x] Create OptimizedImage component
- [x] Update vercel.json with image optimization
- [x] Replace hero images with OptimizedImage
- [x] Implement lazy loading for gallery images

### Phase 2: API Optimization (Medium Impact)
- [ ] Consolidate email functions
- [ ] Add caching headers to API routes
- [ ] Optimize response payloads
- [ ] Implement request deduplication

### Phase 3: Bundle Optimization (Medium Impact)
- [ ] Analyze current bundle sizes
- [ ] Optimize vendor chunks
- [ ] Implement tree shaking
- [ ] Remove unused dependencies

### Phase 4: Monitoring (Ongoing)
- [ ] Set up Vercel Analytics alerts
- [ ] Monitor Core Web Vitals
- [ ] Track Edge Network usage
- [ ] Regular bundle analysis

## Expected Results

### Performance Improvements
- **Image Loading**: 40-60% faster with WebP/AVIF
- **Bundle Size**: 20-30% reduction with optimization
- **Cache Hit Rate**: 80-90% for static assets

### Cost Reduction
- **Edge Requests**: 30-50% reduction through caching
- **Fast Data Transfer**: 40-60% reduction through image optimization
- **Fast Origin Transfer**: 20-30% reduction through API optimization

### User Experience
- **LCP**: 20-40% improvement
- **FID**: 30-50% improvement
- **CLS**: 50-70% improvement

## Monitoring Tools

1. **Vercel Dashboard**: Real-time usage metrics
2. **Web Vitals**: Performance monitoring
3. **Bundle Analyzer**: Size optimization
4. **Lighthouse**: Overall performance score

## Best Practices

1. **Always use OptimizedImage for new images**
2. **Implement proper cache headers**
3. **Monitor bundle sizes regularly**
4. **Use lazy loading for below-the-fold content**
5. **Optimize API responses**
6. **Regular performance audits**

## Resources

- [Vercel Edge Network Documentation](https://vercel.com/docs/edge-network/manage-usage#edge-requests)
- [Vercel Image Optimization](https://vercel.com/docs/image-optimization)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) 