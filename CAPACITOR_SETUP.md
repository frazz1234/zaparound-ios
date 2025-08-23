# Capacitor Setup Guide for ZapAround iOS

## Overview
This guide covers the complete setup of Capacitor for the ZapAround iOS project, including installation, configuration, and development workflow.

## What is Capacitor?
Capacitor is a cross-platform native runtime that makes it easy to build web apps that run natively on iOS, Android, and the web. It provides a consistent API for accessing native device features.

## Installation Summary

### Core Packages Installed
- `@capacitor/core@7.4.3` - Core Capacitor functionality
- `@capacitor/cli@7.4.3` - Command-line interface
- `@capacitor/ios@7.4.3` - iOS platform support

### Essential Plugins Installed
- `@capacitor/app@7.0.2` - App lifecycle and state management
- `@capacitor/haptics@7.0.2` - Haptic feedback
- `@capacitor/keyboard@7.0.2` - Keyboard management
- `@capacitor/status-bar@7.0.2` - Status bar customization
- `@capacitor/device@7.0.2` - Device information
- `@capacitor/network@7.0.2` - Network status monitoring
- `@capacitor/preferences@7.0.2` - Data persistence
- `@capacitor/camera@7.0.2` - Camera access
- `@capacitor/geolocation@7.1.5` - Location services

## Project Configuration

### Capacitor Config (`capacitor.config.ts`)
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaparound.app',
  appName: 'ZapAround',
  webDir: 'dist'
};

export default config;
```

### iOS Configuration
- **Bundle ID**: `com.zaparound.app`
- **App Name**: `ZapAround`
- **Web Directory**: `dist` (Vite build output)

## Development Workflow

### 1. Build the Web App
```bash
npm run build
```
This creates the `dist` directory with optimized web assets.

### 2. Sync with Native Platforms
```bash
npx cap sync ios
```
This copies web assets to the iOS project and updates native dependencies.

### 3. Open in Xcode
```bash
npx cap open ios
```
Opens the iOS project in Xcode for native development and testing.

### 4. Live Reload (Development)
```bash
npm run dev
npx cap run ios --livereload --external
```
Enables live reload during development.

## Available Commands

### Capacitor CLI Commands
- `npx cap init` - Initialize Capacitor in a project
- `npx cap add ios` - Add iOS platform
- `npx cap add android` - Add Android platform (future)
- `npx cap sync` - Sync web assets with all platforms
- `npx cap sync ios` - Sync with iOS only
- `npx cap open ios` - Open iOS project in Xcode
- `npx cap run ios` - Build and run on iOS simulator/device
- `npx cap build ios` - Build iOS project
- `npx cap copy ios` - Copy web assets to iOS
- `npx cap update ios` - Update iOS platform

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production

## Plugin Usage Examples

### App Lifecycle
```typescript
import { App } from '@capacitor/app';

// Listen for app state changes
App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active?', isActive);
});

// Listen for app URL open
App.addListener('appUrlOpen', (data) => {
  console.log('App opened with URL:', data.url);
});
```

### Device Information
```typescript
import { Device } from '@capacitor/device';

const getDeviceInfo = async () => {
  const info = await Device.getInfo();
  console.log('Device info:', info);
};
```

### Camera Access
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
};
```

### Geolocation
```typescript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentPosition = async () => {
  const position = await Geolocation.getCurrentPosition();
  console.log('Current position:', position);
};
```

### Haptics
```typescript
import { Haptics } from '@capacitor/haptics';

const triggerHaptic = async () => {
  await Haptics.impact({ style: 'medium' });
};
```

### Preferences (Data Storage)
```typescript
import { Preferences } from '@capacitor/preferences';

const saveData = async () => {
  await Preferences.set({
    key: 'user_preference',
    value: 'some_value'
  });
};

const getData = async () => {
  const { value } = await Preferences.get({ key: 'user_preference' });
  return value;
};
```

## iOS Development Setup

### Prerequisites
- macOS with Xcode installed
- iOS Simulator or physical iOS device
- Apple Developer Account (for device testing)

### Xcode Project Location
The iOS project is located at: `ios/App/App.xcodeproj`

### Build and Run
1. Open the project in Xcode: `npx cap open ios`
2. Select target device/simulator
3. Click the Run button (▶️) or press Cmd+R

### Simulator Testing
```bash
npx cap run ios --target="iPhone 15 Pro"
```

## Troubleshooting

### Common Issues

#### 1. Sync Fails - Missing dist Directory
**Error**: "Could not find the web assets directory: ./dist"
**Solution**: Run `npm run build` before `npx cap sync ios`

#### 2. Plugin Version Conflicts
**Error**: "peer @capacitor/core@^3.0.0" conflicts
**Solution**: Use compatible plugin versions (v7.x for Capacitor v7)

#### 3. iOS Build Fails
**Solution**: 
- Clean build folder in Xcode (Product → Clean Build Folder)
- Run `npx cap sync ios` again
- Check Xcode console for specific errors

#### 4. Live Reload Not Working
**Solution**: Ensure development server is running and use `--external` flag

### Debug Commands
```bash
# Check Capacitor version
npx cap --version

# List installed plugins
npx cap ls

# Check iOS project status
npx cap doctor ios

# Clean and rebuild
npx cap clean ios
npx cap sync ios
```

## Best Practices

### 1. Development Workflow
- Always build before syncing: `npm run build && npx cap sync ios`
- Use live reload during development
- Test on both simulator and physical devices

### 2. Plugin Management
- Install plugins with compatible versions
- Use `@capacitor/` namespace for official plugins
- Check plugin documentation for iOS-specific requirements

### 3. Build Optimization
- Use production build for testing: `npm run build:prod`
- Monitor bundle size and optimize accordingly
- Test performance on actual devices

### 4. Native Features
- Test native functionality on physical devices
- Handle permissions appropriately
- Implement graceful fallbacks for web-only features

## Next Steps

### Immediate Actions
1. Test the basic setup: `npx cap open ios`
2. Build and run on simulator
3. Test basic plugin functionality

### Future Enhancements
- Add Android platform support
- Implement push notifications
- Add biometric authentication
- Integrate with iOS-specific features (Face ID, Touch ID)

### Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Plugin API Reference](https://capacitorjs.com/docs/apis)
- [Community Forum](https://github.com/ionic-team/capacitor/discussions)

## Support

For Capacitor-specific issues:
- Check the [Capacitor documentation](https://capacitorjs.com/docs)
- Visit the [GitHub repository](https://github.com/ionic-team/capacitor)
- Join the [community discussions](https://github.com/ionic-team/capacitor/discussions)

For project-specific issues:
- Review this documentation
- Check the project's issue tracker
- Consult the development team
