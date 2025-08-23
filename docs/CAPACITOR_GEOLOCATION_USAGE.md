# Capacitor Geolocation Usage Guide

This guide explains how to use the new Capacitor geolocation functionality in your ZapAround project.


### 2. Test the Implementation
Add the test component to any page:
```tsx
import { GeolocationTest } from '@/components/GeolocationTest';

// In your component/page
<GeolocationTest />
```

## 📱 How It Works

### Before (Web API - Broken on iOS)
```tsx
// ❌ This doesn't work properly on iOS
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    // Permission popup may not show
    // Location may not work
  });
}
```

### After (Capacitor - Works on iOS)
```tsx
// ✅ This works properly on iOS
import { geolocationService } from '@/services/geolocationService';

const location = await geolocationService.getCurrentPosition();
// Permission popup will show
// Location will work correctly
```

## 🛠️ Three Ways to Use Geolocation

### 1. Direct Service Usage (Recommended for complex logic)

```tsx
import { geolocationService } from '@/services/geolocationService';

const MyComponent = () => {
  const handleGetLocation = async () => {
    try {
      // This will show permission popup if needed
      const location = await geolocationService.getCurrentPosition();
      
      console.log('Location:', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      });
      
      // Use location data
      setUserLocation(location);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  return (
    <button onClick={handleGetLocation}>
      Get My Location
    </button>
  );
};
```

### 2. React Hook (Recommended for components)

```tsx
import { useGeolocation } from '@/hooks/useGeolocation';

const LocationComponent = () => {
  const {
    location,
    error,
    isLoading,
    permissionStatus,
    getCurrentLocation,
    requestPermission
  } = useGeolocation();

  const handleRequestLocation = async () => {
    if (permissionStatus === 'granted') {
      await getCurrentLocation();
    } else {
      await requestPermission();
    }
  };

  return (
    <div>
      <button onClick={handleRequestLocation} disabled={isLoading}>
        {isLoading ? 'Getting Location...' : 'Get Location'}
      </button>
      
      {location && (
        <div>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
          <p>Accuracy: {location.accuracy}m</p>
        </div>
      )}
      
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {permissionStatus === 'denied' && (
        <p className="text-orange-500">
          Location access denied. Please enable in settings.
        </p>
      )}
    </div>
  );
};
```

### 3. UI Component (Recommended for user interfaces)

```tsx
import { GeolocationPermission } from '@/components/ui/GeolocationPermission';

const LocationPage = () => {
  const handleLocationGranted = (location) => {
    console.log('User granted location access:', location);
    // Navigate to next step, save location, etc.
  };

  const handlePermissionDenied = () => {
    console.log('User denied location access');
    // Show alternative options, manual input, etc.
  };

  return (
    <div>
      <h1>Enable Location Services</h1>
      
      <GeolocationPermission
        onLocationGranted={handleLocationGranted}
        onPermissionDenied={handlePermissionDenied}
        autoRequest={false}
        showPermissionButton={true}
      />
      
      {/* Your other content */}
    </div>
  );
};
```

## 🔄 Updating Existing Components

### Before (Old way)
```tsx
// ❌ Old implementation
const getCurrentLocation = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }
};
```

### After (New way)
```tsx
// ✅ New implementation
import { geolocationService } from '@/services/geolocationService';

const getCurrentLocation = async () => {
  try {
    const location = await geolocationService.getCurrentPosition();
    
    const locationObj = {
      lat: location.latitude,
      lng: location.longitude
    };
    
    setUserLocation(locationObj);
  } catch (error) {
    console.error('Location error:', error);
  }
};
```

## 📍 Advanced Usage

### Watching Location Changes
```tsx
import { geolocationService } from '@/services/geolocationService';

const LocationTracker = () => {
  const [watchId, setWatchId] = useState<string | null>(null);

  const startTracking = async () => {
    const id = await geolocationService.watchPosition(
      (position) => {
        console.log('New position:', position);
        // Update UI with new location
      },
      { enableHighAccuracy: true }
    );
    setWatchId(id);
  };

  const stopTracking = async () => {
    if (watchId) {
      await geolocationService.clearWatch(watchId);
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

### Custom Options
```tsx
const location = await geolocationService.getCurrentPosition({
  enableHighAccuracy: true,  // Better accuracy, more battery usage
  timeout: 15000,            // 15 second timeout
  maximumAge: 600000         // Accept location up to 10 minutes old
});
```

### Permission Management
```tsx
import { geolocationService } from '@/services/geolocationService';

const PermissionManager = () => {
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  const checkPermissions = async () => {
    const status = await geolocationService.checkPermissions();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const granted = await geolocationService.requestPermissions();
    if (granted) {
      console.log('Location permission granted!');
    } else {
      console.log('Location permission denied');
    }
  };

  return (
    <div>
      <p>Permission Status: {permissionStatus}</p>
      <button onClick={checkPermissions}>Check Permissions</button>
      <button onClick={requestPermissions}>Request Permissions</button>
    </div>
  );
};
```

## 🧪 Testing

### 1. Add Test Component
```tsx
// In any page or component
import { GeolocationTest } from '@/components/GeolocationTest';

<GeolocationTest />
```

### 2. Test Flow
1. **Click "Enable Location Access"** - Should show iOS permission popup
2. **Allow location access** - Should show "Location access granted"
3. **Click "Get Current Location"** - Should get coordinates
4. **Check console** - Should log location data

### 3. Test on Device
```bash
# Build and run on device
npm run build
npx cap sync ios
npm run cap:run:ios
```

## 🐛 Troubleshooting

### Permission Popup Not Showing
- ✅ Ensure running on physical device (not simulator)
- ✅ Check `Info.plist` has location permission keys
- ✅ Verify Capacitor sync completed
- ✅ Check iOS Settings > Privacy > Location Services

### Location Not Accurate
- ✅ Enable "High Accuracy" mode
- ✅ Test outdoors for better GPS signal
- ✅ Check device location services are enabled

### Build Errors
```bash
# Clean and rebuild
npm run build
npx cap sync ios
cd ios/App && pod install && cd ../..
npx cap update ios
```

### Common Error Messages
```tsx
// Permission denied
if (error.message === 'Location permission denied') {
  // Show settings link or manual input
}

// Location services disabled
if (error.message.includes('location services')) {
  // Prompt user to enable location services
}

// Timeout
if (error.message.includes('timeout')) {
  // Try again or use cached location
}
```

## 🔧 Configuration

### Capacitor Config
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.zaparound.app',
  appName: 'ZapAround',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      permissions: ['location']
    }
  }
};
```

### iOS Info.plist
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ZapAround needs access to your location to show nearby places, suggest travel destinations, and provide location-based services.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>ZapAround needs access to your location to show nearby places, suggest travel destinations, and provide location-based services.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>ZapAround needs access to your location to show nearby places, suggest travel destinations, and provide location-based services.</string>
```

## 📚 Best Practices

### 1. Always Handle Errors
```tsx
try {
  const location = await geolocationService.getCurrentPosition();
  // Use location
} catch (error) {
  // Handle error gracefully
  if (error.message.includes('permission')) {
    // Show permission help
  } else if (error.message.includes('timeout')) {
    // Show retry option
  }
}
```

### 2. Request Permissions at the Right Time
```tsx
// ✅ Good: Request when user explicitly asks
const handleLocationButton = async () => {
  await geolocationService.requestPermissions();
};

// ❌ Bad: Request immediately on page load
useEffect(() => {
  geolocationService.requestPermissions(); // Too aggressive
}, []);
```

### 3. Provide Clear User Feedback
```tsx
const [locationState, setLocationState] = useState('idle');

const getLocation = async () => {
  setLocationState('loading');
  try {
    const location = await geolocationService.getCurrentPosition();
    setLocationState('success');
  } catch (error) {
    setLocationState('error');
  }
};
```

### 4. Use Appropriate Accuracy Settings
```tsx
// High accuracy for navigation
const location = await geolocationService.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000
});

// Lower accuracy for general location
const location = await geolocationService.getCurrentPosition({
  enableHighAccuracy: false,
  timeout: 5000
});
```

## 🚀 Migration Checklist

- [ ] Update imports to use `geolocationService`
- [ ] Replace `navigator.geolocation` calls
- [ ] Add proper error handling
- [ ] Test permission flow on iOS device
- [ ] Update any location-related UI components
- [ ] Test fallback behavior on web

## 📞 Need Help?

If you encounter issues:

1. Check the console for error messages
2. Verify iOS permissions in Settings
3. Test with the `GeolocationTest` component
4. Check Capacitor logs
5. Ensure running on physical device

The new Capacitor geolocation implementation should resolve your iOS permission issues and provide a robust, cross-platform location solution!
