import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface TripCardMapProps {
  coordinates: [number, number] | null;
  location: string | null;
  tripId: string;
  tripTitle: string;
}

// Utility function to parse coordinates in any format
const parseCoordinates = (coordsData: any): [number, number] | null => {
  if (!coordsData) return null;
  
  try {
    // Case 1: Already an array of numbers
    if (Array.isArray(coordsData) && coordsData.length === 2) {
      const [lng, lat] = coordsData;
      if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
        return [lng, lat];
      }
    }
    
    // Case 2: JSON string of an array
    if (typeof coordsData === 'string') {
      try {
        const parsed = JSON.parse(coordsData);
        if (Array.isArray(parsed) && parsed.length === 2) {
          const [lng, lat] = parsed;
          if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
            return [lng, lat];
          }
        }
      } catch {
        // Not a valid JSON string, try other formats
      }
      
      // Case 3: String format "lat,lng" or "lng,lat"
      if (coordsData.includes(',')) {
        const parts = coordsData.split(',').map(part => parseFloat(part.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return [parts[0], parts[1]] as [number, number];
        }
      }
    }
    
    // Case 4: Object with lat/lng or latitude/longitude properties
    if (typeof coordsData === 'object' && coordsData !== null) {
      if ('lat' in coordsData && 'lng' in coordsData) {
        const { lat, lng } = coordsData;
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          return [lng, lat];
        }
      }
      if ('latitude' in coordsData && 'longitude' in coordsData) {
        const { latitude, longitude } = coordsData;
        if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
          return [longitude, latitude];
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing coordinates:', e, coordsData);
    return null;
  }
};

export const TripCardMap = ({ coordinates, location, tripId, tripTitle }: TripCardMapProps) => {
  const [validCoordinates, setValidCoordinates] = useState<[number, number] | null>(null);
  const [mapUrl, setMapUrl] = useState<string>('');
  
  useEffect(() => {
    const parsedCoords = parseCoordinates(coordinates);
    if (parsedCoords) {
      console.log(`TripCard ${tripId} (${tripTitle}): Setting valid coordinates:`, parsedCoords);
      setValidCoordinates(parsedCoords);
    } else {
      console.log(`TripCard ${tripId} (${tripTitle}): No valid coordinates for ${location || "unknown location"}`);
      setValidCoordinates(null);
    }
  }, [tripId, coordinates, tripTitle, location]);

  useEffect(() => {
    if (validCoordinates) {
      // Mapbox access token
      const accessToken = 'pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ';
      
      // Create marker param for the static map
      const marker = `pin-s+3b82f6(${validCoordinates[0]},${validCoordinates[1]})`;
      
      // Create the static map URL (streets style with marker)
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${marker}/${validCoordinates[0]},${validCoordinates[1]},12/400x144?access_token=${accessToken}`;
      
      setMapUrl(url);
    }
  }, [validCoordinates]);

  if (!validCoordinates) {
    return (
      <div className="w-full h-36 bg-gray-100 flex flex-col items-center justify-center">
        <MapPin className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">No location set</p>
      </div>
    );
  }

  return (
    <div className="w-full h-36 dashboard-card-map">
      <img
        src={mapUrl}
        alt={`Map of ${location || 'location'}`}
        className="w-full h-full border-b object-cover dashboard-trip-map"
        loading="lazy"
      />
    </div>
  );
};
