import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private permissionStatus: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown' = 'unknown';

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Check if we're running on a native platform
   */
  private isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (this.isNative()) {
        // Use Capacitor permissions
        const permissionState = await Geolocation.checkPermissions();
        
        if (permissionState.location === 'granted') {
          this.permissionStatus = 'granted';
          return true;
        }
        
        if (permissionState.location === 'denied') {
          this.permissionStatus = 'denied';
          return false;
        }
        
        // Request permission
        const requestResult = await Geolocation.requestPermissions();
        this.permissionStatus = requestResult.location;
        return requestResult.location === 'granted';
      } else {
        // Web platform - check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }
        
        // For web, we'll check permission when getting location
        this.permissionStatus = 'prompt';
        return true;
      }
    } catch (error) {
      console.error('Error requesting geolocation permissions:', error);
      this.permissionStatus = 'denied';
      return false;
    }
  }

  /**
   * Check current permission status
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> {
    try {
      if (this.isNative()) {
        const permissionState = await Geolocation.checkPermissions();
        this.permissionStatus = permissionState.location;
        return permissionState.location;
      } else {
        // For web, we can't check permissions without trying to get location
        return this.permissionStatus === 'unknown' ? 'prompt' : this.permissionStatus;
      }
    } catch (error) {
      console.error('Error checking geolocation permissions:', error);
      return 'denied';
    }
  }

  /**
   * Get current position with proper error handling
   */
  async getCurrentPosition(options: GeolocationOptions = {}): Promise<LocationCoordinates> {
    try {
      // First check/request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      if (this.isNative()) {
        // Use Capacitor Geolocation
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 300000, // 5 minutes
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
      } else {
        // Fallback to web API
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              });
            },
            (error) => {
              let errorMessage = 'Failed to get location';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied';
                  this.permissionStatus = 'denied';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  break;
                default:
                  errorMessage = 'Unknown location error';
              }
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: options.enableHighAccuracy ?? true,
              timeout: options.timeout ?? 10000,
              maximumAge: options.maximumAge ?? 300000, // 5 minutes
            }
          );
        });
      }
    } catch (error) {
      console.error('Error getting current position:', error);
      throw error;
    }
  }

  /**
   * Watch position changes
   */
  async watchPosition(
    callback: (position: LocationCoordinates) => void,
    options: GeolocationOptions = {}
  ): Promise<string> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      if (this.isNative()) {
        // Use Capacitor watch position
        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 10000,
            maximumAge: options.maximumAge ?? 300000,
          },
          (position) => {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          }
        );
        return watchId;
      } else {
        // Fallback to web API
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            console.error('Watch position error:', error);
          },
          {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 10000,
            maximumAge: options.maximumAge ?? 300000,
          }
        );
        return watchId.toString();
      }
    } catch (error) {
      console.error('Error watching position:', error);
      throw error;
    }
  }

  /**
   * Clear position watch
   */
  async clearWatch(watchId: string): Promise<void> {
    try {
      if (this.isNative()) {
        await Geolocation.clearWatch({ id: watchId });
      } else {
        // For web, watchId is a number
        navigator.geolocation.clearWatch(parseInt(watchId));
      }
    } catch (error) {
      console.error('Error clearing position watch:', error);
    }
  }

  /**
   * Get permission status
   */
  getPermissionStatus(): 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown' {
    return this.permissionStatus;
  }

  /**
   * Check if location services are enabled (iOS only)
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      if (this.isNative()) {
        // This will throw an error if location services are disabled
        await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 5000 });
        return true;
      }
      return true; // Assume enabled for web
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();
