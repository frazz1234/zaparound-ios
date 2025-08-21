import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaparound.app',
  appName: 'zaparound',
  webDir: 'dist',
  ios: {
    // iOS-specific configurations
    scheme: 'zaparound',
    contentInset: 'always',
    backgroundColor: '#fcfcfc',
    // Enable native iOS features
    limitsNavigationsToAppBoundDomains: true,
    // Enable autofill capabilities
    webContentsDebuggingEnabled: false
  },
  plugins: {
    // RevenueCat configuration
    RevenueCat: {
      // RevenueCat will be configured through the service
      // This is just a placeholder for plugin registration
    },
    // Autofill configuration
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#fcfcfc',
      showSpinner: false
    },
    // Geolocation configuration
    Geolocation: {
      // Default geolocation settings
      // These can be overridden in individual calls
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }
  }
};

export default config;
