import { useState, useEffect, useCallback, useRef } from 'react';
import { geolocationService, LocationCoordinates, GeolocationOptions } from '../services/geolocationService';

export interface UseGeolocationReturn {
  // State
  location: LocationCoordinates | null;
  error: string | null;
  isLoading: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown';
  
  // Actions
  getCurrentLocation: (options?: GeolocationOptions) => Promise<void>;
  startWatching: (options?: GeolocationOptions) => Promise<void>;
  stopWatching: () => void;
  requestPermission: () => Promise<boolean>;
  
  // Utils
  hasPermission: boolean;
  isLocationEnabled: boolean;
}

export const useGeolocation = (autoRequest = false): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown'>('unknown');
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  
  const watchIdRef = useRef<string | null>(null);

  // Check initial permission status
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const status = await geolocationService.checkPermissions();
        setPermissionStatus(status);
        
        // Check if location services are enabled
        const enabled = await geolocationService.isLocationEnabled();
        setIsLocationEnabled(enabled);
      } catch (error) {
        console.error('Error checking initial geolocation status:', error);
      }
    };

    checkInitialStatus();
  }, []);

  // Auto-request location if enabled
  useEffect(() => {
    if (autoRequest && permissionStatus === 'granted' && !location) {
      getCurrentLocation();
    }
  }, [autoRequest, permissionStatus, location]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const hasPermission = await geolocationService.requestPermissions();
      const status = await geolocationService.checkPermissions();
      setPermissionStatus(status);
      
      return hasPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async (options?: GeolocationOptions): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const position = await geolocationService.getCurrentPosition(options);
      setLocation(position);
      
      // Update permission status after successful location request
      const status = await geolocationService.checkPermissions();
      setPermissionStatus(status);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setError(errorMessage);
      
      // Update permission status on error
      try {
        const status = await geolocationService.checkPermissions();
        setPermissionStatus(status);
      } catch (checkError) {
        console.error('Error checking permissions after location error:', checkError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startWatching = useCallback(async (options?: GeolocationOptions): Promise<void> => {
    try {
      // Stop any existing watch
      if (watchIdRef.current) {
        await geolocationService.clearWatch(watchIdRef.current);
      }
      
      const watchId = await geolocationService.watchPosition(
        (position) => {
          setLocation(position);
          setError(null);
        },
        options
      );
      
      watchIdRef.current = watchId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start watching location';
      setError(errorMessage);
    }
  }, []);

  const stopWatching = useCallback(async (): Promise<void> => {
    if (watchIdRef.current) {
      try {
        await geolocationService.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      } catch (error) {
        console.error('Error stopping location watch:', error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        geolocationService.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const hasPermission = permissionStatus === 'granted';

  return {
    // State
    location,
    error,
    isLoading,
    permissionStatus,
    
    // Actions
    getCurrentLocation,
    startWatching,
    stopWatching,
    requestPermission,
    
    // Utils
    hasPermission,
    isLocationEnabled,
  };
}; 
