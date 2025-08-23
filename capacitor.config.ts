import type { CapacitorConfig } from '@capacitor/cli';

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

export default config;
