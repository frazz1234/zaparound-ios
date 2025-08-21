import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationPermission {
  location: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
}

export interface DistanceCalculation {
  distance: number; // in kilometers
  bearing: number; // in degrees
}

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Check if geolocation is supported on the current platform
   */
  public isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Request location permissions
   */
  public async requestPermissions(): Promise<LocationPermission> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported on this platform');
    }

    try {
      const result = await Geolocation.requestPermissions();
      return result;
    } catch (error) {
      throw new Error(`Failed to request permissions: ${error}`);
    }
  }

  /**
   * Check current location permissions
   */
  public async checkPermissions(): Promise<LocationPermission> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported on this platform');
    }

    try {
      const result = await Geolocation.checkPermissions();
      return result;
    } catch (error) {
      throw new Error(`Failed to check permissions: ${error}`);
    }
  }

  /**
   * Get current position with default options
   */
  public async getCurrentPosition(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<LocationCoordinates> {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported on this platform');
    }

    try {
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options,
      };

      const result = await Geolocation.getCurrentPosition(defaultOptions);
      return {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
      };
    } catch (error) {
      throw new Error(`Failed to get current position: ${error}`);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  public calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bearing between two coordinates
   */
  public calculateBearing(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  /**
   * Calculate distance and bearing between two coordinates
   */
  public calculateDistanceAndBearing(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): DistanceCalculation {
    return {
      distance: this.calculateDistance(coord1, coord2),
      bearing: this.calculateBearing(coord1, coord2),
    };
  }

  /**
   * Format distance for display
   */
  public formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  /**
   * Check if coordinates are within a certain radius
   */
  public isWithinRadius(
    center: LocationCoordinates,
    point: LocationCoordinates,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusKm;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();
