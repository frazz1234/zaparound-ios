import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  getCurrentPosition: (options?: GeolocationOptions) => Promise<void>;
  watchPosition: (callback: (position: GeolocationPosition) => void, options?: GeolocationOptions) => Promise<string>;
  clearWatch: (watchId: string) => Promise<void>;
  isSupported: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSupported] = useState(Capacitor.isNativePlatform());

  const getCurrentPosition = useCallback(async (options: GeolocationOptions = {}) => {
    if (!isSupported) {
      setError('Geolocation is not supported on this platform');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        ...options,
      };

      const result = await Geolocation.getCurrentPosition(defaultOptions);
      setPosition(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current position';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const watchPosition = useCallback(async (
    callback: (position: GeolocationPosition) => void,
    options: GeolocationOptions = {}
  ): Promise<string> => {
    if (!isSupported) {
      throw new Error('Geolocation is not supported on this platform');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options,
    };

    try {
      const watchId = await Geolocation.watchPosition(defaultOptions, (result) => {
        setPosition(result);
        callback(result);
      });
      return watchId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to watch position';
      setError(errorMessage);
      throw err;
    }
  }, [isSupported]);

  const clearWatch = useCallback(async (watchId: string): Promise<void> => {
    if (!isSupported) {
      return;
    }

    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear watch';
      setError(errorMessage);
    }
  }, [isSupported]);

  // Check permissions on mount
  useEffect(() => {
    if (isSupported) {
      Geolocation.checkPermissions()
        .then(({ location }) => {
          if (location === 'granted') {
            // Auto-get position if permission is already granted
            getCurrentPosition();
          }
        })
        .catch(() => {
          // Permission check failed, this is normal on first use
        });
    }
  }, [isSupported, getCurrentPosition]);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    isSupported,
  };
};
