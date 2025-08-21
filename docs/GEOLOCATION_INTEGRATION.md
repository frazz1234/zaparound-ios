# Geolocation Integration Guide

This document describes the integration of Capacitor's Geolocation plugin into the ZapArounds project, providing location-based features for travel planning and discovery.

## Overview

The geolocation integration provides:
- Real-time GPS location tracking
- Distance and bearing calculations
- Location permission management
- Background location support (iOS)
- Cross-platform compatibility

## Installation

The plugin has been installed and configured:

```bash
npm install @capacitor/geolocation
npx cap sync
```

## iOS Configuration

### Info.plist Permissions

The following location permissions have been added to `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ZapAround needs access to your location to provide personalized travel recommendations, show nearby attractions, and help you discover local experiences during your trips.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>ZapAround needs access to your location to provide personalized travel recommendations, show nearby attractions, and help you discover local experiences during your trips.</string>
```

### Background Location

While this plugin doesn't directly support background geolocation, iOS may report location updates in the background. The `NSLocationAlwaysAndWhenInUseUsageDescription` permission is required for this functionality.

## Components

### 1. useGeolocation Hook

A React hook that provides geolocation functionality:

```typescript
import { useGeolocation } from '../hooks/useGeolocation';

const MyComponent = () => {
  const { 
    position, 
    error, 
    loading, 
    isSupported,
    getCurrentPosition,
    watchPosition,
    clearWatch 
  } = useGeolocation();

  // Use the hook functionality
};
```

**Features:**
- Automatic permission checking
- Position state management
- Error handling
- Loading states
- Platform support detection

### 2. GeolocationService

A service class providing utility functions:

```typescript
import { geolocationService } from '../services/geolocationService';

// Get current position
const coords = await geolocationService.getCurrentPosition();

// Calculate distance between two points
const distance = geolocationService.calculateDistance(point1, point2);

// Check permissions
const permissions = await geolocationService.checkPermissions();
```

**Available Methods:**
- `getCurrentPosition()` - Get current GPS coordinates
- `requestPermissions()` - Request location permissions
- `checkPermissions()` - Check current permission status
- `calculateDistance()` - Calculate distance between coordinates
- `calculateBearing()` - Calculate bearing between coordinates
- `formatDistance()` - Format distance for display
- `isWithinRadius()` - Check if point is within radius

### 3. LocationPermissionButton

A UI component for managing location permissions:

```typescript
import { LocationPermissionButton } from '../components/ui/LocationPermissionButton';

<LocationPermissionButton
  onLocationGranted={(lat, lng) => console.log(lat, lng)}
  onLocationDenied={() => console.log('Permission denied')}
  variant="outline"
  size="default"
/>
```

**Features:**
- Permission request handling
- Visual feedback for different states
- Callback support for granted/denied events
- Responsive design with badges

### 4. LocationDemo

A comprehensive demo component showcasing all features:

```typescript
import { LocationDemo } from '../components/ui/LocationDemo';

<LocationDemo className="w-full max-w-md" />
```

**Features:**
- Real-time position display
- Distance and bearing calculations
- Live tracking controls
- Error handling display
- Responsive UI with animations

## Usage Examples

### Basic Location Access

```typescript
import { useGeolocation } from '../hooks/useGeolocation';

const LocationComponent = () => {
  const { position, getCurrentPosition } = useGeolocation();

  const handleGetLocation = async () => {
    await getCurrentPosition();
  };

  return (
    <div>
      <button onClick={handleGetLocation}>Get My Location</button>
      {position && (
        <p>
          Lat: {position.coords.latitude}, 
          Lng: {position.coords.longitude}
        </p>
      )}
    </div>
  );
};
```

### Continuous Location Tracking

```typescript
import { useGeolocation } from '../hooks/useGeolocation';

const TrackingComponent = () => {
  const { watchPosition, clearWatch } = useGeolocation();
  const [watchId, setWatchId] = useState<string | null>(null);

  const startTracking = async () => {
    const id = await watchPosition((position) => {
      console.log('New position:', position);
      // Handle position updates
    });
    setWatchId(id);
  };

  const stopTracking = async () => {
    if (watchId) {
      await clearWatch(watchId);
      setWatchId(null);
    }
  };

  return (
    <div>
      <button onClick={startTracking}>Start Tracking</button>
      <button onClick={stopTracking}>Stop Tracking</button>
    </div>
  );
};
```

### Distance Calculations

```typescript
import { geolocationService } from '../services/geolocationService';

const DistanceComponent = () => {
  const [distance, setDistance] = useState<number | null>(null);

  const calculateDistance = async () => {
    try {
      const currentPos = await geolocationService.getCurrentPosition();
      const destination = { latitude: 40.7128, longitude: -74.0060 }; // NYC
      
      const dist = geolocationService.calculateDistance(currentPos, destination);
      setDistance(dist);
    } catch (error) {
      console.error('Failed to calculate distance:', error);
    }
  };

  return (
    <div>
      <button onClick={calculateDistance}>Calculate Distance to NYC</button>
      {distance && <p>Distance: {geolocationService.formatDistance(distance)}</p>}
    </div>
  );
};
```

## Error Handling

The integration includes comprehensive error handling:

```typescript
const { error, position } = useGeolocation();

if (error) {
  // Handle different error types
  switch (error) {
    case 'User denied geolocation':
      // Show permission request UI
      break;
    case 'Location unavailable':
      // Show fallback content
      break;
    default:
      // Show generic error message
  }
}
```

## Best Practices

### 1. Permission Management
- Always check permissions before requesting location
- Provide clear explanations for location usage
- Handle permission denial gracefully

### 2. Performance
- Use `watchPosition` sparingly to conserve battery
- Implement appropriate timeouts and accuracy settings
- Clear watchers when components unmount

### 3. User Experience
- Show loading states during location requests
- Provide fallback content for location-denied users
- Use appropriate accuracy levels for different use cases

### 4. Privacy
- Only request location when necessary
- Respect user privacy preferences
- Provide clear privacy information

## Platform Considerations

### iOS
- Requires privacy descriptions in Info.plist
- Supports background location updates
- High accuracy GPS available

### Android
- Runtime permissions required
- Background location restrictions
- Battery optimization considerations

### Web
- Limited to HTTPS connections
- Browser permission handling
- Fallback to IP-based location

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check Info.plist configuration
   - Verify permission request flow
   - Handle gracefully with fallback content

2. **Location Unavailable**
   - Check device GPS settings
   - Verify internet connectivity
   - Implement timeout handling

3. **High Battery Usage**
   - Reduce watchPosition frequency
   - Use appropriate accuracy settings
   - Implement smart tracking logic

### Debug Mode

Enable debug logging in development:

```typescript
// In development builds
if (process.env.NODE_ENV === 'development') {
  console.log('Geolocation debug:', { position, error, loading });
}
```

## Future Enhancements

Potential improvements for the geolocation integration:

1. **Background Location**
   - Implement background location tracking
   - Add geofencing capabilities
   - Optimize battery usage

2. **Offline Support**
   - Cache location data
   - Offline distance calculations
   - Sync when online

3. **Advanced Features**
   - Route tracking
   - Speed monitoring
   - Location history

4. **Integration**
   - Map integration
   - Weather services
   - Social features

## Support

For issues or questions about the geolocation integration:

1. Check this documentation
2. Review Capacitor Geolocation plugin docs
3. Check iOS/Android platform-specific guides
4. Review error logs and console output

## License

This integration follows the same license as the main ZapArounds project.
