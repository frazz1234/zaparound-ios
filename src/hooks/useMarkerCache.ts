import { useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import ReactDOMServer from 'react-dom/server';
import { CableCar, Car, PlaneTakeoff } from 'lucide-react';
import React from 'react';

interface TripMarker {
  id: string;
  type: 'zapout' | 'zaproad' | 'zaptrip';
  coordinates: [number, number];
  title: string;
  location?: string;
}

interface CachedMarker {
  marker: mapboxgl.Marker;
  tripId: string;
  type: string;
  coordinates: [number, number];
  isVisible: boolean;
}

const TRIP_TYPE_COLORS = {
  zapout: '#10b981',
  zaproad: '#f97316', 
  zaptrip: '#0ea5e9',
  default: '#6b7280'
};

export const useMarkerCache = () => {
  const markerCache = useRef<Map<string, CachedMarker>>(new Map());
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Set the map reference
  const setMap = useCallback((map: mapboxgl.Map | null) => {
    mapRef.current = map;
  }, []);

  // Create marker element with optimized rendering
  const createMarkerElement = useCallback((trip: TripMarker) => {
    const markerEl = document.createElement('div');
    markerEl.className = 'map-marker';
    markerEl.style.width = '30px';
    markerEl.style.height = '30px';
    markerEl.style.borderRadius = '50%';
    markerEl.style.background = TRIP_TYPE_COLORS[trip.type] || TRIP_TYPE_COLORS.default;
    markerEl.style.cursor = 'pointer';
    markerEl.style.display = 'flex';
    markerEl.style.alignItems = 'center';
    markerEl.style.justifyContent = 'center';
    markerEl.style.color = 'white';
    markerEl.style.fontWeight = 'bold';
    markerEl.style.fontSize = '14px';
    markerEl.style.border = '2px solid white';
    markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    markerEl.style.transition = 'box-shadow 0.2s ease';
    
    // Use icons instead of letters for better performance
    let iconMarkup = '';
    if (trip.type === 'zapout') {
      iconMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(CableCar, { className: "w-5 h-5" }));
    } else if (trip.type === 'zaproad') {
      iconMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(Car, { className: "w-5 h-5" }));
    } else if (trip.type === 'zaptrip') {
      iconMarkup = ReactDOMServer.renderToStaticMarkup(React.createElement(PlaneTakeoff, { className: "w-5 h-5" }));
    }
    markerEl.innerHTML = iconMarkup;
    
    return markerEl;
  }, []);

  // Update markers efficiently
  const updateMarkers = useCallback((trips: TripMarker[], activeFilter?: string | null) => {
    if (!mapRef.current) return;

    const filteredTrips = activeFilter 
      ? trips.filter(trip => trip.type === activeFilter)
      : trips;

    const newMarkerIds = new Set<string>();
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    // Process each trip
    filteredTrips.forEach(trip => {
      if (!trip.coordinates) return;
      
      const [lng, lat] = trip.coordinates;
      if (!lng || !lat || isNaN(lng) || isNaN(lat)) return;

      const markerId = `${trip.type}-${trip.id}`;
      newMarkerIds.add(markerId);

      // Check if marker already exists and is in the right position
      const existingMarker = markerCache.current.get(markerId);
      
      if (existingMarker) {
        const currentLngLat = existingMarker.marker.getLngLat();
        
        // Update position if needed
        if (currentLngLat.lng !== lng || currentLngLat.lat !== lat) {
          existingMarker.marker.setLngLat([lng, lat]);
          existingMarker.coordinates = [lng, lat];
        }
        
        // Show marker if it was hidden
        if (!existingMarker.isVisible) {
          existingMarker.marker.addTo(mapRef.current!);
          existingMarker.isVisible = true;
        }
      } else {
        // Create new marker
        const markerEl = createMarkerElement(trip);
        
        // Add hover effects
        markerEl.onmouseover = () => {
          markerEl.style.zIndex = '10';
          markerEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        };
        markerEl.onmouseout = () => {
          markerEl.style.zIndex = '1';
          markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        };

        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);

        // Store in cache
        markerCache.current.set(markerId, {
          marker,
          tripId: trip.id,
          type: trip.type,
          coordinates: [lng, lat],
          isVisible: true
        });
      }

      // Extend bounds
      bounds.extend([lng, lat]);
      hasValidCoordinates = true;
    });

    // Hide markers that are no longer needed
    markerCache.current.forEach((cachedMarker, markerId) => {
      if (!newMarkerIds.has(markerId) && cachedMarker.isVisible) {
        cachedMarker.marker.remove();
        cachedMarker.isVisible = false;
      }
    });

    // Fit bounds if we have valid coordinates
    if (hasValidCoordinates && mapRef.current) {
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }

    return bounds;
  }, [createMarkerElement]);

  // Add click handler to marker
  const addMarkerClickHandler = useCallback((markerId: string, onClick: () => void) => {
    const cachedMarker = markerCache.current.get(markerId);
    if (cachedMarker) {
      const element = cachedMarker.marker.getElement();
      // Remove existing listeners to prevent duplicates
      element.removeEventListener('click', onClick);
      element.addEventListener('click', onClick);
    }
  }, []);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markerCache.current.forEach((cachedMarker) => {
      if (cachedMarker.isVisible) {
        cachedMarker.marker.remove();
        cachedMarker.isVisible = false;
      }
    });
  }, []);

  // Remove specific marker
  const removeMarker = useCallback((markerId: string) => {
    const cachedMarker = markerCache.current.get(markerId);
    if (cachedMarker && cachedMarker.isVisible) {
      cachedMarker.marker.remove();
      cachedMarker.isVisible = false;
    }
  }, []);

  // Get marker statistics
  const getMarkerStats = useCallback(() => {
    const total = markerCache.current.size;
    const visible = Array.from(markerCache.current.values()).filter(m => m.isVisible).length;
    return { total, visible, hidden: total - visible };
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    markerCache.current.forEach((cachedMarker) => {
      if (cachedMarker.isVisible) {
        cachedMarker.marker.remove();
      }
    });
    markerCache.current.clear();
  }, []);

  return {
    setMap,
    updateMarkers,
    addMarkerClickHandler,
    clearMarkers,
    removeMarker,
    getMarkerStats,
    cleanup
  };
}; 