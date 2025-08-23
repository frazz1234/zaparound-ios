import { useRef, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapCacheOptions {
  container: HTMLElement | null;
  style: string;
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  showTerrain?: boolean;
  isMobile?: boolean;
}

interface CachedMapInstance {
  map: mapboxgl.Map;
  style: string;
  isInitialized: boolean;
  markers: mapboxgl.Marker[];
  sources: string[];
  layers: string[];
}

export const useMapCache = () => {
  const mapCache = useRef<Map<string, CachedMapInstance>>(new Map());
  const currentMapKey = useRef<string>('');

  // Generate a cache key based on map configuration
  const getMapKey = useCallback((options: MapCacheOptions): string => {
    return `${options.style}-${options.showTerrain ? 'terrain' : 'no-terrain'}-${options.isMobile ? 'mobile' : 'desktop'}`;
  }, []);

  // Initialize or retrieve cached map
  const getOrCreateMap = useCallback((options: MapCacheOptions): mapboxgl.Map | null => {
    if (!options.container) return null;

    const mapKey = getMapKey(options);
    currentMapKey.current = mapKey;

    // Check if we have a cached map with the same configuration
    const cached = mapCache.current.get(mapKey);
    
    if (cached && cached.map && !cached.map._removed) {
      // Reuse existing map
      console.log('Reusing cached map instance:', mapKey);
      
      // Update container if needed
      if (cached.map.getContainer() !== options.container) {
        cached.map.getContainer().removeChild(cached.map.getCanvas());
        options.container.appendChild(cached.map.getCanvas());
      }
      
      // Update view if needed
      const currentCenter = cached.map.getCenter();
      const currentZoom = cached.map.getZoom();
      
      if (currentCenter.lng !== options.center[0] || 
          currentCenter.lat !== options.center[1] || 
          Math.abs(currentZoom - options.zoom) > 0.1) {
        cached.map.setCenter(options.center);
        cached.map.setZoom(options.zoom);
        if (options.pitch !== undefined) cached.map.setPitch(options.pitch);
        if (options.bearing !== undefined) cached.map.setBearing(options.bearing);
      }
      
      return cached.map;
    }

    // Create new map instance
    console.log('Creating new map instance:', mapKey);
    
    // Set access token
    mapboxgl.accessToken = 'pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ';

    const map = new mapboxgl.Map({
      container: options.container,
      style: options.style,
      center: options.center,
      zoom: options.zoom,
      pitch: options.pitch || 60,
      bearing: options.bearing || 0,
      attributionControl: false,
      // Performance optimizations
      preserveDrawingBuffer: false,
      antialias: false,
      fadeDuration: 0,
      crossSourceCollisions: false,
    });

    // Initialize map with controls and layers
    const initializeMap = async () => {
      await new Promise<void>((resolve) => {
        const onStyleLoad = () => {
          // Remove existing controls to prevent duplicates
          const existingControls = document.querySelectorAll('.mapboxgl-ctrl-group, .mapboxgl-ctrl-attrib');
          existingControls.forEach(control => control.remove());

          // Add navigation controls
          const navControl = new mapboxgl.NavigationControl({ 
            showCompass: !options.isMobile,
            visualizePitch: !options.isMobile
          });
          map.addControl(navControl, 'top-right');
          map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
          map.addControl(
            new mapboxgl.AttributionControl({
              compact: true,
            }),
            'bottom-right'
          );

          // Add terrain and 3D layers only if enabled and not already added
          if (options.showTerrain) {
            addTerrainLayers(map);
          }

          // Add route source
          if (!map.getSource('route')) {
            map.addSource('route', {
              'type': 'geojson',
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

          map.off('style.load', onStyleLoad);
          resolve();
        };

        map.on('style.load', onStyleLoad);
      });
    };

    // Store in cache
    const cachedInstance: CachedMapInstance = {
      map,
      style: options.style,
      isInitialized: false,
      markers: [],
      sources: ['route'],
      layers: []
    };

    mapCache.current.set(mapKey, cachedInstance);

    // Initialize the map
    initializeMap().then(() => {
      cachedInstance.isInitialized = true;
    });

    return map;
  }, [getMapKey]);

  // Add terrain layers to map
  const addTerrainLayers = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });

      map.setTerrain({ 
        'source': 'mapbox-dem',
        'exaggeration': 1.5 
      });
    }

    if (!map.getLayer('sky')) {
      map.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });
    }

    // Only add water and building layers for non-satellite styles
    const currentStyle = map.getStyle().name || '';
    if (!currentStyle.includes('satellite')) {
      if (!map.getLayer('water') && map.getSource('mapbox')) {
        map.addLayer({
          'id': 'water',
          'source': 'mapbox',
          'source-layer': 'water',
          'type': 'fill',
          'paint': {
            'fill-color': '#93c5fd',
            'fill-opacity': 0.8
          }
        });
      }

      if (!map.getLayer('building') && map.getSource('mapbox')) {
        map.addLayer({
          'id': 'building',
          'source': 'mapbox',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'paint': {
            'fill-extrusion-color': '#9ca3af',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        });
      }
    }
  }, []);

  // Cache markers for reuse
  const cacheMarkers = useCallback((markers: mapboxgl.Marker[]) => {
    const currentCached = mapCache.current.get(currentMapKey.current);
    if (currentCached) {
      // Clear old markers
      currentCached.markers.forEach(marker => marker.remove());
      currentCached.markers = markers;
    }
  }, []);

  // Update map style efficiently
  const updateMapStyle = useCallback((newStyle: string) => {
    const currentCached = mapCache.current.get(currentMapKey.current);
    if (currentCached && currentCached.map && currentCached.style !== newStyle) {
      console.log('Updating map style from', currentCached.style, 'to', newStyle);
      currentCached.map.setStyle(newStyle);
      currentCached.style = newStyle;
      currentCached.isInitialized = false;
      
      // Re-initialize after style change
      currentCached.map.once('style.load', () => {
        currentCached.isInitialized = true;
      });
    }
  }, []);

  // Clear cache for a specific key or all
  const clearCache = useCallback((key?: string) => {
    if (key) {
      const cached = mapCache.current.get(key);
      if (cached) {
        cached.markers.forEach(marker => marker.remove());
        if (cached.map && !cached.map._removed) {
          cached.map.remove();
        }
        mapCache.current.delete(key);
      }
    } else {
      // Clear all cache
      mapCache.current.forEach((cached) => {
        cached.markers.forEach(marker => marker.remove());
        if (cached.map && !cached.map._removed) {
          cached.map.remove();
        }
      });
      mapCache.current.clear();
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      size: mapCache.current.size,
      keys: Array.from(mapCache.current.keys()),
      currentKey: currentMapKey.current
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  return {
    getOrCreateMap,
    cacheMarkers,
    updateMapStyle,
    clearCache,
    getCacheStats,
    addTerrainLayers
  };
}; 