interface GeoPosition {
  name: string;
  type: string;
  coordinates: [number, number];
  description?: string;
}

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

const isIOS = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const isMobileDevice = () => {
  return isAndroid() || isIOS();
};

export const openGoogleMapsNavigation = (geopositions: GeoPosition[]) => {
  if (geopositions.length === 0) return;

  // For single location
  if (geopositions.length === 1) {
    const [lng, lat] = geopositions[0].coordinates;
    let url: string;

    if (isMobileDevice()) {
      if (isAndroid()) {
        url = `google.navigation:q=${lat},${lng}`;
      } else {
        // iOS needs a different format
        url = `comgooglemaps://?q=${lat},${lng}`;
        
        // Fallback to Apple Maps if Google Maps is not installed
        const fallbackUrl = `maps://?q=${lat},${lng}`;
        
        // Try to open Google Maps first
        window.location.href = url;
        
        // Set a timeout to try Apple Maps if Google Maps didn't open
        setTimeout(() => {
          window.location.href = fallbackUrl;
        }, 2000);
        return;
      }
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    window.open(url, '_blank');
    return;
  }

  // For multiple locations (route)
  const origin = geopositions[0];
  const destination = geopositions[geopositions.length - 1];
  const waypoints = geopositions.slice(1, -1);
  let url: string;

  if (isMobileDevice()) {
    if (isAndroid()) {
      // Android Google Maps deep link with proper waypoints
      url = `google.navigation:q=${destination.coordinates[1]},${destination.coordinates[0]}`;
      
      if (waypoints.length > 0) {
        // Add origin and waypoints as a single parameter
        const allPoints = [origin, ...waypoints]
          .map(wp => `${wp.coordinates[1]},${wp.coordinates[0]}`)
          .join('+to:');
        url = `google.navigation:q=${allPoints}+to:${destination.coordinates[1]},${destination.coordinates[0]}`;
      }
    } else {
      // iOS Google Maps deep link with proper waypoints
      url = 'comgooglemaps://?';
      url += `saddr=${origin.coordinates[1]},${origin.coordinates[0]}`; // Starting point
      url += `&daddr=${destination.coordinates[1]},${destination.coordinates[0]}`; // Destination
      
      if (waypoints.length > 0) {
        // Add waypoints as additional destinations
        const waypointsStr = waypoints
          .map(wp => `+to:${wp.coordinates[1]},${wp.coordinates[0]}`)
          .join('');
        url += waypointsStr;
      }
      
      url += '&directionsmode=driving';

      // Fallback to Apple Maps if Google Maps is not installed
      const fallbackUrl = `maps://?saddr=${origin.coordinates[1]},${origin.coordinates[0]}&daddr=${destination.coordinates[1]},${destination.coordinates[0]}`;
      
      // Try to open Google Maps first
      window.location.href = url;
      
      // Set a timeout to try Apple Maps if Google Maps didn't open
      setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 2000);
      return;
    }
  } else {
    // Desktop Google Maps URL
    url = 'https://www.google.com/maps/dir/?api=1';
    url += `&origin=${origin.coordinates[1]},${origin.coordinates[0]}`;
    url += `&destination=${destination.coordinates[1]},${destination.coordinates[0]}`;
    
    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .map(wp => `${wp.coordinates[1]},${wp.coordinates[0]}`)
        .join('|');
      url += `&waypoints=${waypointsStr}`;
    }
    url += '&travelmode=driving';
  }

  if (isAndroid()) {
    window.location.href = url;
  } else if (!isIOS()) {
    window.open(url, '_blank');
  }
}; 