import React from 'react';
import { Button } from './button';
import { Alert, AlertDescription } from './alert';
import { MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface GeolocationPermissionProps {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void;
  onPermissionDenied?: () => void;
  autoRequest?: boolean;
  showPermissionButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const GeolocationPermission: React.FC<GeolocationPermissionProps> = ({
  onLocationGranted,
  onPermissionDenied,
  autoRequest = false,
  showPermissionButton = true,
  className = '',
  children
}) => {
  const {
    location,
    error,
    isLoading,
    permissionStatus,
    getCurrentLocation,
    requestPermission,
    hasPermission,
    isLocationEnabled
  } = useGeolocation(autoRequest);

  // Call callback when location is granted
  React.useEffect(() => {
    if (location && onLocationGranted) {
      onLocationGranted(location);
    }
  }, [location, onLocationGranted]);

  // Call callback when permission is denied
  React.useEffect(() => {
    if (permissionStatus === 'denied' && onPermissionDenied) {
      onPermissionDenied();
    }
  }, [permissionStatus, onPermissionDenied]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      await getCurrentLocation();
    }
  };

  const handleGetLocation = async () => {
    await getCurrentLocation();
  };

  const renderPermissionStatus = () => {
    switch (permissionStatus) {
      case 'granted':
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location access granted
            </AlertDescription>
          </Alert>
        );
      
      case 'denied':
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Location access denied. Please enable location permissions in your device settings.
            </AlertDescription>
          </Alert>
        );
      
      case 'prompt':
      case 'prompt-with-rationale':
        return (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Location permission needed to provide location-based services.
            </AlertDescription>
          </Alert>
        );
      
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (!showPermissionButton) return null;

    if (permissionStatus === 'granted') {
      return (
        <div className="flex gap-2">
          <Button
            onClick={handleGetLocation}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isLoading ? 'Getting Location...' : 'Get Current Location'}
          </Button>
        </div>
      );
    }

    if (permissionStatus === 'denied') {
      return (
        <Button
          onClick={handleRequestPermission}
          variant="outline"
          size="sm"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      );
    }

    return (
      <Button
        onClick={handleRequestPermission}
        disabled={isLoading}
        size="sm"
      >
        <MapPin className="h-4 w-4 mr-2" />
        {isLoading ? 'Requesting...' : 'Enable Location Access'}
      </Button>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <Alert className="border-red-200 bg-red-50 mt-2">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  };

  const renderLocationInfo = () => {
    if (!location) return null;

    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-800">
          <strong>Current Location:</strong>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
          {location.accuracy && ` (Accuracy: ${Math.round(location.accuracy)}m)`}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {renderPermissionStatus()}
      
      {renderActionButtons()}
      
      {renderError()}
      
      {renderLocationInfo()}
      
      {children}
    </div>
  );
};
