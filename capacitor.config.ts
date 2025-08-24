import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaparound.app',
  appName: 'ZapAround',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      permissions: ['location']
    },
    Camera: {
      ios: {
        permissions: ['camera', 'photo-library', 'photo-library-add']
      }
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true
    },
    Browser: {
      ios: {
        presentationStyle: 'popover'
      }
    },
    Keyboard: {
      resize: 'body',
      style: 'DEFAULT',
      resizeOnFullScreen: true
    },
    Preferences: {
      ios: {
        // Enable persistent storage for image caching
        persistent: true
      }
    }
  }
};

export default config;
