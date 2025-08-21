# Camera Integration with Capacitor

This document describes the integration of the Capacitor Camera API into the ZapArounds project, providing native camera functionality for both iOS and web platforms.

## Overview

The camera integration allows users to:
- Take photos using the device camera
- Select existing photos from the photo library
- Handle permissions gracefully
- Process and display captured images
- Support multiple languages (English, French, Spanish)

## Installation

The camera functionality is already installed and configured in this project:

```bash
npm install @capacitor/camera
npx cap sync
```

## iOS Configuration

The following permissions have been added to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>ZapAround needs access to your camera to take photos for your travel memories and trip documentation.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>ZapAround needs access to save photos to your photo library for your travel memories.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>ZapAround needs access to your photo library to select existing photos for your travel memories and trip documentation.</string>
```

## Components

### 1. CameraService (`src/services/cameraService.ts`)

A service class that provides a clean interface for camera operations:

```typescript
import CameraService from '@/services/cameraService';

// Take a photo
const result = await CameraService.takePhoto({
  quality: 90,
  allowEditing: true
});

// Pick from library
const result = await CameraService.pickPhoto({
  quality: 90,
  allowEditing: false
});

// Check permissions
const permissions = await CameraService.checkPermissions();

// Request permissions
const permissions = await CameraService.requestPermissions();
```

### 2. CameraCapture (`src/components/ui/CameraCapture.tsx`)

A React component that provides a user-friendly interface for camera operations:

```tsx
import { CameraCapture } from '@/components/ui/CameraCapture';

<CameraCapture
  onImageCaptured={(result) => console.log('Image captured:', result)}
  onError={(error) => console.error('Camera error:', error)}
  quality={90}
  allowEditing={true}
>
  <Button>Take Photo</Button>
</CameraCapture>
```

### 3. CameraDemo (`src/components/ui/CameraDemo.tsx`)

A demo component showcasing the camera functionality with image preview and metadata display.

## Usage Examples

### Basic Photo Capture

```tsx
import { CameraCapture } from '@/components/ui/CameraCapture';

function MyComponent() {
  const handleImageCaptured = (result) => {
    console.log('Image captured:', result.webPath);
    // Process the image...
  };

  return (
    <CameraCapture onImageCaptured={handleImageCaptured}>
      <Button>📸 Take Photo</Button>
    </CameraCapture>
  );
}
```

### Custom Camera Options

```tsx
<CameraCapture
  onImageCaptured={handleImageCaptured}
  quality={80}
  allowEditing={true}
  onError={handleError}
>
  <Button variant="outline">Custom Camera</Button>
</CameraCapture>
```

### Programmatic Camera Access

```tsx
import CameraService from '@/services/cameraService';

async function takePhotoProgrammatically() {
  try {
    // Check permissions first
    const permissions = await CameraService.checkPermissions();
    
    if (permissions.camera !== 'granted') {
      const newPerms = await CameraService.requestPermissions();
      if (newPerms.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }
    }
    
    // Take photo
    const result = await CameraService.takePhoto({
      quality: 90,
      allowEditing: false
    });
    
    return result;
  } catch (error) {
    console.error('Failed to take photo:', error);
    throw error;
  }
}
```

## API Reference

### CameraService Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `takePhoto(options)` | Take a photo using the camera | `Promise<CameraResult>` |
| `pickPhoto(options)` | Select a photo from the library | `Promise<CameraResult>` |
| `checkPermissions()` | Check current permissions | `Promise<{camera: string, photos: string}>` |
| `requestPermissions()` | Request camera permissions | `Promise<{camera: string, photos: string}>` |
| `isAvailable()` | Check if camera is available | `Promise<boolean>` |

### CameraOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quality` | number | 90 | Image quality (0-100) |
| `allowEditing` | boolean | false | Allow user to edit photo |
| `resultType` | CameraResultType | Uri | Result format (Uri, Base64, DataUrl) |
| `source` | CameraSource | Camera | Source (Camera, Photos, Prompt) |
| `width` | number | - | Target image width |
| `height` | number | - | Target image height |
| `direction` | CameraDirection | Back | Camera direction (Front, Back) |

### CameraResult

| Property | Type | Description |
|----------|------|-------------|
| `webPath` | string | Web-accessible path to the image |
| `format` | string | Image format (jpeg, png, etc.) |
| `saved` | boolean | Whether the image was saved to library |
| `path` | string | Native file path (iOS only) |
| `exif` | any | EXIF metadata |

## Internationalization

Camera-related text is available in multiple languages:

- **English**: `public/locales/en/camera.json`
- **French**: `public/locales/fr/camera.json`
- **Spanish**: `public/locales/es/camera.json`

The camera namespace is automatically loaded by the i18n configuration.

## Error Handling

The camera integration includes comprehensive error handling:

```tsx
<CameraCapture
  onError={(error) => {
    // Handle specific error types
    if (error.includes('permission')) {
      // Show permission request UI
    } else if (error.includes('camera')) {
      // Show camera unavailable message
    } else {
      // Show generic error
    }
  }}
/>
```

## Platform Support

- **iOS**: Full native camera support with permissions
- **Web**: Uses browser camera API when available
- **Android**: Ready for future Android implementation

## Testing

To test the camera functionality:

1. Run the app on an iOS device or simulator
2. Navigate to the CameraDemo component
3. Test both camera capture and photo library selection
4. Verify permission handling
5. Test error scenarios

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure Info.plist contains the required permission descriptions
2. **Camera Not Available**: Check if running on a device with camera hardware
3. **Build Errors**: Run `npx cap sync` after adding new Capacitor plugins

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages and camera operation logs.

## Future Enhancements

- [ ] Android platform support
- [ ] Video recording capabilities
- [ ] Advanced image filters and editing
- [ ] Batch photo capture
- [ ] Cloud storage integration
- [ ] Social media sharing

## Contributing

When adding new camera features:

1. Update the CameraService with new methods
2. Add corresponding UI components
3. Include proper error handling
4. Add translations for all supported languages
5. Update this documentation
6. Test on both iOS and web platforms

## Resources

- [Capacitor Camera Documentation](https://capacitorjs.com/docs/apis/camera)
- [iOS Camera Usage Guidelines](https://developer.apple.com/design/human-interface-guidelines/camera)
- [React Native Camera Best Practices](https://reactnative.dev/docs/cameraroll)
