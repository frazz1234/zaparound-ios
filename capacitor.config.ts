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
    hostname: 'zaparound.com', // For universal links 
    // Enable native iOS features
    limitsNavigationsToAppBoundDomains: false,
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
      launchAutoHide: true,
      backgroundColor: "#fcfcfc",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#61936f",
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
