import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { MapPin, MapPinOff, Loader2 } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { geolocationService } from '../../services/geolocationService';
import { cn } from '../../lib/utils';

interface LocationPermissionButtonProps {
  onLocationGranted?: (latitude: number, longitude: number) => void;
  onLocationDenied?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LocationPermissionButton: React.FC<LocationPermissionButtonProps> = ({
  onLocationGranted,
  onLocationDenied,
  className,
  variant = 'outline',
  size = 'default',
}) => {
  const { position, error, loading, isSupported } = useGeolocation();
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  useEffect(() => {
    if (position && onLocationGranted) {
      onLocationGranted(position.coords.latitude, position.coords.longitude);
    }
  }, [position, onLocationGranted]);

  useEffect(() => {
    if (error && onLocationDenied) {
      onLocationDenied();
    }
  }, [error, onLocationDenied]);

  const checkPermissionStatus = async () => {
    if (!isSupported) {
      setPermissionStatus('unknown');
      return;
    }

    try {
      const result = await geolocationService.checkPermissions();
      setPermissionStatus(result.location);
    } catch {
      setPermissionStatus('unknown');
    }
  };

  const requestLocationPermission = async () => {
    if (!isSupported) {
      return;
    }

    try {
      const result = await geolocationService.requestPermissions();
      setPermissionStatus(result.location);
      
      if (result.location === 'granted') {
        // Permission granted, get current position
        const coords = await geolocationService.getCurrentPosition();
        if (onLocationGranted) {
          onLocationGranted(coords.latitude, coords.longitude);
        }
      } else if (result.location === 'denied' && onLocationDenied) {
        onLocationDenied();
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
      if (onLocationDenied) {
        onLocationDenied();
      }
    }
  };

  const getButtonContent = () => {
    if (!isSupported) {
      return (
        <>
          <MapPinOff className="h-4 w-4 mr-2" />
          Location Not Supported
        </>
      );
    }

    if (loading) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Getting Location...
        </>
      );
    }

    if (permissionStatus === 'granted' && position) {
      return (
        <>
          <MapPin className="h-4 w-4 mr-2 text-green-600" />
          Location Active
        </>
      );
    }

    if (permissionStatus === 'denied') {
      return (
        <>
          <MapPinOff className="h-4 w-4 mr-2 text-red-600" />
          Location Denied
        </>
      );
    }

    return (
      <>
        <MapPin className="h-4 w-4 mr-2" />
        Enable Location
      </>
    );
  };

  const getButtonVariant = () => {
    if (!isSupported) return 'secondary';
    if (permissionStatus === 'granted') return 'default';
    if (permissionStatus === 'denied') return 'secondary';
    return variant;
  };

  const getButtonDisabled = () => {
    return !isSupported || loading || permissionStatus === 'granted';
  };

  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="secondary"
          size={size}
          disabled
          className="opacity-50"
        >
          {getButtonContent()}
        </Button>
        <Badge variant="secondary" className="text-xs">
          Web Only
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={getButtonVariant()}
        size={size}
        onClick={requestLocationPermission}
        disabled={getButtonDisabled()}
        className={cn(
          permissionStatus === 'granted' && 'bg-green-600 hover:bg-green-700',
          permissionStatus === 'denied' && 'bg-red-600 hover:bg-red-700'
        )}
      >
        {getButtonContent()}
      </Button>
      
      {permissionStatus === 'granted' && position && (
        <Badge variant="outline" className="text-xs">
          {position.coords.accuracy ? `${Math.round(position.coords.accuracy)}m` : 'GPS'}
        </Badge>
      )}
      
      {permissionStatus === 'denied' && (
        <Badge variant="destructive" className="text-xs">
          Permission Denied
        </Badge>
      )}
    </div>
  );
};
