import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GeoPosition {
  name: string;
  type: string;
  coordinates: [number, number];
  description?: string;
}

interface TripMapProps {
  className?: string;
  height?: string;
  center?: [number, number];
  zoom?: number;
  geopositions?: GeoPosition[];
  onMarkerClick?: (position: GeoPosition) => void;
  showTerrain?: boolean;
  initialCenter?: [number, number];
}

// Custom marker styles
const markerStyles = `
.custom-marker {
  width: 35px;
  height: 35px;
  cursor: pointer;
  transform-origin: bottom;
  transition: all 0.3s ease;
}

.custom-marker:hover {
  transform: scale(1.1) translateY(-5px);
}

.marker-content {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(45deg, #3b82f6, #6366f1);
  border: 3px solid white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.mapboxgl-popup {
  max-width: 300px !important;
}

.mapboxgl-popup-content {
  padding: 0 !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
}

.popup-content {
  padding: 16px;
  background: white;
}

.popup-header {
  padding: 12px 16px;
  background: linear-gradient(to right, #3b82f6, #6366f1);
  color: white;
  margin: -16px -16px 12px -16px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.popup-description {
  color: #4b5563;
  font-size: 14px;
  margin: 8px 0;
}

.popup-coordinates {
  display: flex;
  align-items: center;
  color: #6b7280;
  font-size: 12px;
  margin-top: 8px;
}

.popup-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}
`;

const TripMap = ({ 
  className = "", 
  height = "500px",
  center = [2.3488, 48.8534], // Default to Paris
  zoom = 12,
  geopositions = [],
  onMarkerClick,
  showTerrain = true,
  initialCenter
}: TripMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [validCenter] = useState<[number, number]>(initialCenter || center);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Add custom styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = markerStyles;
    document.head.appendChild(styleSheet);

    // Initialize map only if it doesn't exist
    if (!map.current) {
      mapboxgl.accessToken = 'pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ';
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: showTerrain 
          ? 'mapbox://styles/mapbox/outdoors-v12'
          : 'mapbox://styles/mapbox/streets-v12',
        center: validCenter,
        zoom: zoom,
        pitch: 60, // Increased 3D perspective
        bearing: 0,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(
        new mapboxgl.FullscreenControl(),
        'top-right'
      );

      // Add terrain and sky layers for 3D effect
      map.current.on('load', () => {
        if (!map.current) return;

        if (showTerrain) {
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });

          map.current.setTerrain({ 
            'source': 'mapbox-dem',
            'exaggeration': 1.5 
          });

          map.current.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });

          // Add custom layer styles for water and buildings
          if (!map.current.getLayer('water-custom')) {
            map.current.addLayer({
              'id': 'water-custom',
              'type': 'fill',
              'source': 'composite',
              'source-layer': 'water',
              'paint': {
                'fill-color': '#93c5fd',
                'fill-opacity': 0.8
              }
            });
          }

          if (!map.current.getLayer('building-custom')) {
            map.current.addLayer({
              'id': 'building-custom',
              'type': 'fill-extrusion',
              'source': 'composite',
              'source-layer': 'building',
              'paint': {
                'fill-extrusion-color': '#9ca3af',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.6
              }
            });
          }
        }

        // Add route source and layer with improved styling
        if (!map.current.getSource('route')) {
          map.current.addSource('route', {
            'type': 'geojson',
            'lineMetrics': true, // Enable line metrics for gradient
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': []
              }
            }
          });
        }

        if (!map.current.getLayer('route-outline')) {
          map.current.addLayer({
            'id': 'route-outline',
            'type': 'line',
            'source': 'route',
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#ffffff',
              'line-width': 8,
              'line-opacity': 0.8,
              'line-blur': 0.5
            }
          });
        }

        if (!map.current.getLayer('route')) {
          map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#3b82f6',
              'line-gradient': [
                'interpolate',
                ['linear'],
                ['line-progress'],
                0, '#3b82f6',
                1, '#6366f1'
              ],
              'line-width': 4,
              'line-opacity': 1
            }
          });
        }
      });
    }

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      // Clean up custom styles
      document.head.removeChild(styleSheet);
    };
  }, [showTerrain]); 

  // Update route and markers when geopositions change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for each geoposition
    geopositions.forEach((pos, index) => {
      if (!map.current) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      
      const markerContent = document.createElement('div');
      markerContent.className = 'marker-content';
      markerContent.textContent = `${index + 1}`;
      el.appendChild(markerContent);

      // Create popup with enhanced styling
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        maxWidth: '300px'
      }).setHTML(`
        <div class="popup-content">
          <div class="popup-header">
            <h3 class="popup-title">${pos.name}</h3>
          </div>
          ${pos.description ? `
            <p class="popup-description">${pos.description}</p>
          ` : ''}
          <div class="popup-coordinates">
            <svg class="popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            ${pos.coordinates[1].toFixed(4)}, ${pos.coordinates[0].toFixed(4)}
          </div>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(pos.coordinates)
        .setPopup(popup)
        .addTo(map.current);

      // Add click handler
      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(pos);
        }
        setActiveMarkerId(pos.name);
      });

      markers.current.push(marker);
    });

    // Update route line if there are multiple points
    if (geopositions.length > 1 && map.current.getSource('route')) {
      const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      routeSource.setData({
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': geopositions.map(pos => pos.coordinates)
        }
      });
    }

    // Fit map to show all markers with padding
    if (geopositions.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      geopositions.forEach(pos => {
        bounds.extend(pos.coordinates);
      });

      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        maxZoom: 15
      });
    } else {
      map.current.setCenter(validCenter);
      map.current.setZoom(zoom);
    }
  }, [geopositions, zoom, validCenter, onMarkerClick]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-inner" />
    </div>
  );
};

export default TripMap;
