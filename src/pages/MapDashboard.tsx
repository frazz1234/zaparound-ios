import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Compass, Loader2, Mountain, Layers, ChevronLeft, ChevronRight, X, Crosshair, Lock, Sparkles, Car, PlaneTakeoff, CableCar, Heart, Map, UtensilsCrossed, Coffee, Hotel, ShoppingBag, Landmark, Palette, TreePine, Wine, Building, Settings, Menu, Satellite, Locate, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { MapSearch } from '@/components/MapSearch';
import { useUserRole } from '@/hooks/useUserRole';
import { usePOIs, POI } from '@/hooks/usePOIs';
import { POIReviewDialog } from '@/components/POIReviewDialog';
import ReactDOMServer from 'react-dom/server';
import { useMapData, MapTripData, MapFavoriteData } from '@/hooks/useMapData';
import { useCheckpointCache } from '@/hooks/useCheckpointCache';
import { useMapCache } from '@/hooks/useMapCache';
import { useMarkerCache } from '@/hooks/useMarkerCache';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cacheEventManager, CACHE_EVENTS, invalidateFavoriteCaches } from '../utils/cache';
import { createPlaceUrl, createPlaceSlug } from '@/utils/placeUtils';

// Utility function to detect mobile devices
const isMobileDevice = () => {
  return (
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ))
  );
};

// Utility function to parse coordinates in any format
const parseCoordinates = (coordsData: any): [number, number] | null => {
  if (!coordsData) return null;
  
  try {
    // Case 1: Already an array
    if (Array.isArray(coordsData) && coordsData.length === 2) {
      const [lng, lat] = coordsData;
      if (typeof lng === 'number' && typeof lat === 'number') {
        return [lng, lat];
      }
    }
    
    // Case 2: JSON string of an array
    if (typeof coordsData === 'string') {
      try {
        const parsed = JSON.parse(coordsData);
        if (Array.isArray(parsed) && parsed.length === 2) {
          const [lng, lat] = parsed;
          if (typeof lng === 'number' && typeof lat === 'number') {
            return [lng, lat];
          }
        }
      } catch {
        // Not a valid JSON, try other formats
      }
      
      // Case 3: String format "lat, lng" (e.g., "46.8144, -71.2082")
      if (coordsData.includes(',')) {
        const parts = coordsData.split(',').map(part => parseFloat(part.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          // Convert from lat,lng to lng,lat for Mapbox
          return [parts[1], parts[0]];
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing coordinates:', e, coordsData);
    return null;
  }
};

// Define marker colors for different trip types
const TRIP_TYPE_COLORS = {
  zapout: '#10b981', // emerald
  zaproad: '#f59e0b', // amber
  zaptrip: '#0ea5e9', // sky
  default: '#0ea5e9', // sky
};

// Define locale mapping
const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

type TripData = {
  id: string;
  title: string;
  type: 'zapout' | 'zaproad' | 'zaptrip';
  coordinates: [number, number] | null;
  location: string | null;
  description?: string | null;
  created_at: string;
  // ZapRoad specific fields
  starting_city?: string | null;
  starting_city_coordinates?: string | null;
  end_city?: string | null;
  end_city_coordinates?: string | null;
};

type FavoritePlace = {
  id: number;
  place_id: string;
  place_name: string;
  place_address: string;
  place_rating: number;
  place_lat: number;
  place_lng: number;
  place_types: string[];
  created_at: string;
};

type TravelMode = 'driving' | 'walking' | 'cycling';

// Helper function to create external place URLs with placeId as query parameter
const createExternalPlaceUrl = (placeId: string, placeName: string, language: string = 'en'): string => {
  const slug = createPlaceSlug(placeName);
  return `/${language}/zap-places/${slug}?id=${placeId}`;
};

const MapDashboard = () => {
  const { t } = useTranslation(['navigation', 'common']);
  const { i18n } = useTranslation();
  const language = i18n.language;
  const locale = LOCALE_MAP[language] || 'en_US';
  

  
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useUserRole();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapMarkers = useRef<mapboxgl.Marker[]>([]);
  const checkpointMarkers = useRef<mapboxgl.Marker[]>([]);
  const favoriteMarkers = useRef<mapboxgl.Marker[]>([]);
  const poiMarkers = useRef<mapboxgl.Marker[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<MapTripData | null>(null);
  
  // Use the new caching hooks
  const { 
    mapData, 
    loading: isLoading, 
    error,
    fetchMapData, 
    fetchIncrementalData, 
    invalidateCache, 
    removeTripFromCache, 
    removeFavoriteFromCache,
    refreshData 
  } = useMapData();
  
  const {
    loading: checkpointLoading,
    fetchZapoutCheckpoints,
    fetchZaproadCheckpoints,
    fetchZaptripCheckpoints,
    invalidateCheckpointCache,
    clearAllCheckpointCaches
  } = useCheckpointCache();
  
  const {
    getOrCreateMap,
    cacheMarkers,
    updateMapStyle,
    clearCache: clearMapCache,
    getCacheStats: getMapCacheStats,
    addTerrainLayers
  } = useMapCache();
  
  const {
    setMap,
    updateMarkers,
    addMarkerClickHandler,
    clearMarkers,
    removeMarker,
    getMarkerStats,
    cleanup: cleanupMarkers
  } = useMarkerCache();
  
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/streets-v12');
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const pulsingDot = useRef<HTMLDivElement | null>(null);
  const currentPopup = useRef<mapboxgl.Popup | null>(null);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { lang } = useParams();
  const [expandedCities, setExpandedCities] = useState<string[]>([]);

  const isTier1 = userRole === 'tier1';

  // POI hook - only fetch POIs, no review functionality
  const { pois, loading: poisLoading, addPOIReview } = usePOIs();

  // Extract trips and favorites from mapData
  const trips = mapData.trips;
  const favorites = mapData.favorites;

  // Touch handlers for swipe gestures on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Don't handle touch if it's on the close button or accordion
    const target = e.target as HTMLElement;
    if (target.closest('button[aria-label="Close sidebar"]') || 
        target.closest('[data-radix-accordion-trigger]') ||
        target.closest('[data-radix-accordion-item]') ||
        target.closest('[role="button"]') ||
        target.closest('button')) {
      return;
    }
    
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || touchStartX === null) return;
    
    // Don't handle touch if it's on the close button or accordion
    const target = e.target as HTMLElement;
    if (target.closest('button[aria-label="Close sidebar"]') || 
        target.closest('[data-radix-accordion-trigger]') ||
        target.closest('[data-radix-accordion-item]') ||
        target.closest('[role="button"]') ||
        target.closest('button')) {
      setTouchStartX(null);
      return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX;
    
    // Swipe left to close sidebar (when open)
    if (diffX < -50 && sidebarVisible) {
      setSidebarVisible(false);
    }
    
    setTouchStartX(null);
  };

  // Check if device is mobile on component mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobileCheck = isMobileDevice();
      setIsMobile(isMobileCheck);
      
      // When desktop, always show sidebar
      if (!isMobileCheck) {
        setSidebarVisible(true);
      } else {
        // When mobile, close sidebar by default
        setSidebarVisible(false);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // The data fetching is now handled by the useMapData hook
  // No need for manual data fetching here

  // Handle initial state from navigation
  useEffect(() => {
    if (location.state?.selectedTripId && location.state?.tripType) {
      const selectedTrip = trips.find(trip => 
        trip.id === location.state.selectedTripId && 
        trip.type === location.state.tripType
      );
      
      if (selectedTrip) {
        handleTripClick(selectedTrip);
      }
    }
  }, [trips, location.state]);

  // Initialize map using cache
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if device is mobile
    const mobile = isMobileDevice();

    // Use the cached map instance
    const cachedMap = getOrCreateMap({
      container: mapContainer.current,
      style: mapStyle,
      center: [2.3488, 48.8534], // Default to Paris
      zoom: 3, // Lower zoom to show more of the world initially
      pitch: 60,
      bearing: 0,
      showTerrain,
      isMobile: mobile,
    });

    // Set the map reference
    map.current = cachedMap;

    // Set up marker cache with the map instance
    setMap(cachedMap);

    // Clean up on unmount
    return () => {
      cleanupMarkers();
      clearMapCache();
    };
  }, [getOrCreateMap, setMap, cleanupMarkers, clearMapCache]);

  // Update map style when mapStyle changes
  useEffect(() => {
    if (map.current) {
      updateMapStyle(mapStyle);
    }
  }, [mapStyle, updateMapStyle]);

  // Handle mobile orientation changes
  useEffect(() => {
    if (!isMobile) return;

    const handleOrientationChange = () => {
      // Resize the map after orientation change
      if (map.current) {
        setTimeout(() => {
          map.current?.resize();
          
          // Recenter the map on the selected trip if there is one
          if (selectedTrip?.coordinates) {
            map.current?.flyTo({
              center: selectedTrip.coordinates,
              zoom: 13,
              duration: 500,
            });
          }
        }, 200);
      }
    };

    // Add event listeners for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile, selectedTrip]);

  // Handle map style change
  const changeMapStyle = (style: string) => {
    setMapStyle(style);
  };

  // Add trip markers to map
  useEffect(() => {
    if (!map.current || isLoading) return;
    
    console.log('MapDashboard: Updating markers with', trips.length, 'trips');
    console.log('MapDashboard: Trip data:', trips);

    // Clear existing markers
    mapMarkers.current.forEach(marker => marker && marker.remove());
    mapMarkers.current = [];

    // Filter trips if a filter is active
    const filteredTrips = activeFilter 
      ? trips.filter(trip => trip.type === activeFilter)
      : trips;

    // Add markers for trips with valid coordinates
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    filteredTrips.forEach(trip => {
      if (!trip.coordinates) return;
      
      try {
        const [lng, lat] = trip.coordinates;
        
        // Skip invalid coordinates
        if (!lng || !lat || isNaN(lng) || isNaN(lat)) return;
        
        // Create marker element
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
        
        // Use icons instead of letters
        let iconMarkup = '';
        if (trip.type === 'zapout') {
          iconMarkup = ReactDOMServer.renderToStaticMarkup(<CableCar className="w-5 h-5" />);
        } else if (trip.type === 'zaproad') {
          iconMarkup = ReactDOMServer.renderToStaticMarkup(<Car className="w-5 h-5" />);
        } else if (trip.type === 'zaptrip') {
          iconMarkup = ReactDOMServer.renderToStaticMarkup(<PlaneTakeoff className="w-5 h-5" />);
        }
        markerEl.innerHTML = iconMarkup;
        
        // Add hover effect - REMOVING transform effects
        markerEl.onmouseover = () => {
          markerEl.style.zIndex = '10';
          markerEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        };
        markerEl.onmouseout = () => {
          markerEl.style.zIndex = '1';
          markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        };

        // Create and add marker
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        // Add click handler
        marker.getElement().addEventListener('click', () => {
          handleTripClick(trip);
        });
        
        // Store marker for cleanup
        mapMarkers.current.push(marker);
        
        // Extend bounds
        bounds.extend([lng, lat]);
        hasValidCoordinates = true;
      } catch (err) {
        console.error(`Error creating marker for trip ${trip.id}:`, err);
      }
    });

    // Fit bounds if we have valid coordinates
    if (hasValidCoordinates && map.current) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }

    // Add favorites to map
    addFavoritesToMap();
  }, [trips, isLoading, activeFilter]);

  // Clear checkpoint markers
  const clearCheckpointMarkers = () => {
    // Remove all checkpoint markers
    checkpointMarkers.current.forEach(marker => marker.remove());
    checkpointMarkers.current = [];
    console.log('Cleared all checkpoint markers');
  };

  // Navigate to trip details when clicking on trip card
  const handleTripClick = (trip: MapTripData) => {
    console.log('Trip clicked:', trip);
    
    // If this is the same trip as the currently selected one, deselect it
    if (selectedTrip?.id === trip.id && selectedTrip?.type === trip.type) {
      setSelectedTrip(null);
      // Clear checkpoints and routes when deselecting
      clearCheckpointsAndRoute();
      // On mobile, keep sidebar open after deselection
      if (isMobile) {
        setSidebarVisible(true);
      }
      return;
    }
    
    setSelectedTrip(trip);
    
    // On mobile, show the sidebar when a trip is selected
    if (isMobile) {
      setSidebarVisible(true);
    }
    
    // Clear any existing checkpoints and routes
    clearCheckpointsAndRoute();
    
    // Navigate to appropriate location based on trip type
    if (trip.coordinates) {
      const [lng, lat] = trip.coordinates;
      console.log(`Flying to coordinates [${lng}, ${lat}] for trip: ${trip.id}`);
      
      // Add highlighting for the selected trip marker
      mapMarkers.current.forEach(marker => {
        const el = marker.getElement();
        el.style.zIndex = '1'; // Reset z-index
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'; // Reset shadow
        
        // Check if this marker belongs to the selected trip
        const markerLngLat = marker.getLngLat();
        if (markerLngLat.lng === lng && markerLngLat.lat === lat) {
          // Highlight the selected marker without transform
          el.style.zIndex = '10'; // Bring to front
          el.style.boxShadow = `0 0 0 4px ${TRIP_TYPE_COLORS[trip.type]}`;
        }
      });
      
      map.current?.flyTo({
        center: [lng, lat],
        zoom: 13,
        duration: 1500,
      });
      
      // Use cached checkpoint data
      console.log('Fetching cached checkpoints for:', trip.id);
      displayCachedCheckpoints(trip);
    } else {
      console.warn('No coordinates available for trip:', trip.id);
    }
  };

  // Handle view details button click
  const handleViewDetails = (trip: TripData) => {
    // Save the origin information in local storage
    localStorage.setItem('tripDetailsPreviousPage', 'mapDashboard');
    
    switch (trip.type) {
      case 'zapout':
        navigate(`/${lang}/zapout/${trip.id}`);
        break;
      case 'zaproad':
        navigate(`/${lang}/zaproad/${trip.id}`);
        break;
      case 'zaptrip':
        navigate(`/${lang}/trips/${trip.id}`);
        break;
    }
  };

  // Add this function to get directions from Mapbox API
  const getDirectionsRoute = async (points: [number, number][], mode: TravelMode = 'driving') => {
    if (points.length < 2) return null;
    
    try {
      // Format coordinates for the Mapbox Directions API
      const coordinates = points.map(p => p.join(',')).join(';');
      
      // Call the Mapbox Directions API with the specified travel mode
      // Add options to ensure the route passes through all waypoints exactly
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${mode}/${coordinates}?` + 
        `geometries=geojson&overview=full&radiuses=${points.map(() => '50').join(';')}&` +
        `approaches=${points.map(() => 'curb').join(';')}&` +
        `waypoints=${points.map((_, i) => i).join(';')}&` +
        `access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  };

  // New cached checkpoint functions using the useCheckpointCache hook
  const displayCachedCheckpoints = async (trip: MapTripData) => {
    try {
      let cachedData;
      
      switch (trip.type) {
        case 'zapout':
          cachedData = await fetchZapoutCheckpoints(trip.id, travelMode);
          break;
        case 'zaproad':
          cachedData = await fetchZaproadCheckpoints(trip.id, travelMode);
          break;
        case 'zaptrip':
          cachedData = await fetchZaptripCheckpoints(trip.id);
          break;
        default:
          return;
      }
      
      if (!cachedData || !cachedData.checkpoints.length) {
        console.log('No checkpoints found for trip:', trip.id);
        return;
      }
      
      // Clear existing checkpoint markers
      clearCheckpointMarkers();
      
      // Add route if available
      if (cachedData.routeGeometry && map.current) {
        removeExistingRouteLayers();
        
        map.current.addSource('cached-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: cachedData.routeGeometry
            }
          }
        });
        
        map.current.addLayer({
          id: 'cached-route-line',
          type: 'line',
          source: 'cached-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': TRIP_TYPE_COLORS[trip.type],
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
        
        map.current.addLayer({
          id: 'cached-route-glow',
          type: 'line',
          source: 'cached-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 7,
            'line-opacity': 0.4,
            'line-blur': 2
          }
        }, 'cached-route-line');
      }
      
      // Add checkpoint markers
      cachedData.checkpoints.forEach((checkpoint, index) => {
        const markerEl = document.createElement('div');
        markerEl.style.width = index === 0 ? '32px' : '24px';
        markerEl.style.height = index === 0 ? '32px' : '24px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.background = TRIP_TYPE_COLORS[trip.type];
        markerEl.style.color = 'white';
        markerEl.style.fontWeight = 'bold';
        markerEl.style.display = 'flex';
        markerEl.style.alignItems = 'center';
        markerEl.style.justifyContent = 'center';
        markerEl.style.fontSize = index === 0 ? '14px' : '12px';
        markerEl.style.border = '2px solid white';
        markerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        markerEl.textContent = index === 0 ? '📍' : index.toString();
        
        // Add hover effect
        markerEl.style.transition = 'box-shadow 0.2s ease';
        markerEl.onmouseover = () => {
          markerEl.style.zIndex = '10';
          markerEl.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        };
        markerEl.onmouseout = () => {
          markerEl.style.zIndex = '1';
          markerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        };
        
        // Create popup
        const popupContent = `
          <div class="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-4 h-4 bg-${trip.type === 'zapout' ? 'emerald' : trip.type === 'zaproad' ? 'amber' : 'sky'}-500 rounded-full flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 class="font-semibold text-sm">${checkpoint.name}</h3>
            </div>
            <p class="text-xs text-gray-600">${checkpoint.address}</p>
          </div>
        `;
        
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'trip-popup'
        }).setHTML(popupContent);
        
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat(checkpoint.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
        
        // Add click handler
        markerEl.addEventListener('click', () => {
          if (currentPopup.current) {
            currentPopup.current.remove();
          }
          currentPopup.current = popup;
        });
        
        popup.on('close', () => {
          if (currentPopup.current === popup) {
            currentPopup.current = null;
          }
        });
        
        checkpointMarkers.current.push(marker);
      });
      
      // Fit bounds to show all checkpoints
      const bounds = new mapboxgl.LngLatBounds();
      cachedData.checkpoints.forEach(checkpoint => {
        bounds.extend(checkpoint.coordinates);
      });
      
      map.current?.fitBounds(bounds, {
        padding: 70,
        duration: 1000
      });
      
    } catch (error) {
      console.error('Error displaying cached checkpoints:', error);
    }
  };

  // Old checkpoint functions removed - now using cached versions from useCheckpointCache hook

  // Helper function to remove any existing route layers and sources
  const removeExistingRouteLayers = () => {
    if (!map.current) return;
    
    try {
      // Remove layers first
      const layers = ['zaproad-route-line', 'zaproad-route-glow'];
      layers.forEach(layer => {
        if (map.current?.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      
      // Then remove sources
      const sources = ['zaproad-route'];
      sources.forEach(source => {
        if (map.current?.getSource(source)) {
          map.current.removeSource(source);
        }
      });

      // Update the route source data if it exists
      const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      if (routeSource) {
        routeSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
    } catch (e) {
      console.error('Error removing existing route layers:', e);
    }
  };

  // Clear checkpoints and route when deselecting
  const clearCheckpointsAndRoute = () => {
    // Clear checkpoint markers
    clearCheckpointMarkers();
    
    // Clear route layers
    removeExistingRouteLayers();
    
    // Clear POI markers
    poiMarkers.current.forEach(marker => marker.remove());
    poiMarkers.current = [];
  };

  // Add custom pulsing dot creation
  const createPulsingDot = () => {
    // Remove existing pulsing dot if any
    if (pulsingDot.current) {
      pulsingDot.current.remove();
    }

    // Create main container
    const el = document.createElement('div');
    el.className = 'location-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.position = 'relative';

    // Create the map pin image
    const pin = document.createElement('img');
    pin.src = '/icons/iconloaction.png';
    pin.style.width = '100%';
    pin.style.height = '100%';
    pin.style.objectFit = 'contain';
    el.appendChild(pin);
    
    pulsingDot.current = el;
    return el;
  };

  // Update geolocate function
  const handleGeolocate = () => {
    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Remove existing location marker if any
          if (locationMarker.current) {
            locationMarker.current.remove();
          }

          // Create and add new marker
          const markerEl = createPulsingDot();
          locationMarker.current = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'center'
          })
            .setLngLat([longitude, latitude])
            .addTo(map.current!);

          // Add a success toast with a fun message

          
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            duration: 1500
          });
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: t('error'),
            description: "Oops! Couldn't find you. Are you using a teleporter? 🚀",
            variant: "destructive",
          });
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: t('error'),
        description: "Looks like your device doesn't support location services. Time to get a new compass! 🧭",
        variant: "destructive",
      });
      setIsLocating(false);
    }
  };

  // Add cleanup for location marker in the cleanup effect
  useEffect(() => {
    return () => {
      if (locationMarker.current) {
        locationMarker.current.remove();
      }
      if (pulsingDot.current) {
        pulsingDot.current.remove();
      }
      // Clear all markers
      mapMarkers.current.forEach(marker => marker.remove());
      favoriteMarkers.current.forEach(marker => marker.remove());
      poiMarkers.current.forEach(marker => marker.remove());
      checkpointMarkers.current.forEach(marker => marker.remove());
    };
  }, []);

  // Add this function to create a custom marker element
  const createPinMarker = (location?: any) => {
    // Helper functions for category emoji and color (matching the logic from addPOIsToMap)
    const getCategoryEmoji = (category?: string, placeType?: string[]) => {
      if (placeType?.includes('address')) {
        return '🏠';
      }
      
      if (placeType?.includes('poi')) {
        if (!category) return '📍';
        
        switch (category) {
          case 'restaurant':
            return '🍽️';
          case 'food':
            return '🍽️';
          case 'cafe':
            return '🍽️';
          case 'coffee':
            return '🍽️';
          case 'hotel':
            return '🏨';
          case 'lodging':
            return '🏨';
          case 'bar':
            return '🍺';
          case 'nightlife':
            return '🍺';
          case 'museum':
            return '🏛️';
          case 'art':
            return '🏛️';
          case 'park':
            return '🌳';
          case 'nature':
            return '🌳';
          case 'shopping':
            return '🛍️';
          case 'store':
            return '🛍️';
          case 'entertainment':
            return '🎉';
          case 'attraction':
            return '🎡';
          default:
            return '📍';
        }
      }
      
      return '📍';
    };

    const getCategoryColor = (category?: string, placeType?: string[]) => {
      if (placeType?.includes('address')) {
        return '#6b7280'; // Gray for addresses
      }
      
      if (placeType?.includes('poi')) {
        switch (category) {
          case 'restaurant':
          case 'food':
            return '#ef4444'; // Red
          case 'cafe':
          case 'coffee':
            return '#8b5cf6'; // Purple
          case 'hotel':
          case 'lodging':
            return '#3b82f6'; // Blue
          case 'bar':
          case 'nightlife':
            return '#f59e0b'; // Amber
          case 'museum':
          case 'art':
            return '#10b981'; // Emerald
          case 'park':
          case 'nature':
            return '#059669'; // Green
          case 'shopping':
          case 'store':
            return '#ec4899'; // Pink
          case 'entertainment':
          case 'attraction':
            return '#f97316'; // Orange
          default:
            return '#6b7280'; // Gray
        }
      }
      
      return '#6b7280'; // Default gray
    };

    // Get category information from location if available
    const category = location?.properties?.category || location?.type;
    const placeType = location?.place_type || location?.properties?.place_type;
    
    // Get emoji and color based on category
    const categoryEmoji = getCategoryEmoji(category, placeType);
    const categoryColor = getCategoryColor(category, placeType);

    const el = document.createElement('div');
    el.className = 'pin-marker';
    
    // Create the main icon container (matching the style from addPOIsToMap)
    const iconContainer = document.createElement('div');
    iconContainer.style.width = '40px';
    iconContainer.style.height = '40px';
    iconContainer.style.background = categoryColor;
    iconContainer.style.borderRadius = '50%';
    iconContainer.style.border = '3px solid white';
    iconContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.fontSize = '14px';
    iconContainer.style.overflow = 'hidden';
    iconContainer.style.transition = 'box-shadow 0.2s ease';
    iconContainer.style.transform = 'none';

    // Use emoji for category representation
    iconContainer.textContent = categoryEmoji;

    // Add the icon container to the main element
    el.appendChild(iconContainer);
    
    el.style.fontSize = '32px';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    
    return el;
  };

  // Update the handleLocationSelect function
  const handleLocationSelect = (location: any) => {
    if (!map.current || !location.center) return;

    // Skip marker creation for zapplaces (database POIs)
    if (location.properties?.source === 'database_poi') {
      // For zapplaces, just fly to the location without creating a marker
      // since they already have their own markers on the map
      map.current.flyTo({
        center: location.center,
        zoom: location.zoom || 15,
        duration: 1500
      });
      return;
    }

    // Remove existing location marker if any
    if (locationMarker.current) {
      locationMarker.current.remove();
    }

    // Create a pin marker for the selected location with category information
    const markerEl = createPinMarker(location);
    locationMarker.current = new mapboxgl.Marker({
      element: markerEl,
      anchor: 'center'
    })
      .setLngLat(location.center)
      .addTo(map.current);

    // Add a bounce animation to the marker
    const bounce = () => {
      markerEl.style.transform = 'translate(-50%, -50%) translateY(-10px)';
      setTimeout(() => {
        markerEl.style.transform = 'translate(-50%, -50%)';
      }, 200);
    };
    bounce();

    // Fly to the location
    map.current.flyTo({
      center: location.center,
      zoom: location.zoom || 15,
      duration: 1500
    });

    // Show success toast

  };

  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  // Add favorites to map
  const addFavoritesToMap = () => {
    if (!map.current) return;

    // Always clear existing favorite markers first
    favoriteMarkers.current.forEach(marker => marker.remove());
    favoriteMarkers.current = [];

    // Only add markers if showFavorites is true
    if (!showFavorites) return;

    favorites.forEach(favorite => {
      if (favorite.place_lat && favorite.place_lng) {
        // Create custom marker element for favorites
        const el = document.createElement('div');
        el.className = 'favorite-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.background = '#ef4444'; // Red color for favorites
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([favorite.place_lng, favorite.place_lat])
          .addTo(map.current);

        // Create popup
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          className: 'favorite-popup'
        })
          .setHTML(`
            <div class="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
              <div class="flex items-center space-x-2 mb-2">
                <div class="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-sm">${favorite.place_name}</h3>
              </div>
              <p class="text-xs text-gray-600 mb-2">${favorite.place_address}</p>
              ${favorite.place_rating ? `
                <div class="flex items-center space-x-1 mb-2">
                  <span class="text-yellow-500 text-xs">★</span>
                  <span class="text-xs text-gray-600">${favorite.place_rating.toFixed(1)}</span>
                </div>
              ` : ''}
              <div class="flex space-x-2">
                <button onclick="window.open('${createExternalPlaceUrl(favorite.place_id, favorite.place_name, 'en')}', '_blank')" class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">
                  ${t('favorites.viewDetails')}
                </button>
                <button onclick="getFavoriteDirections(${favorite.id})" class="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors flex items-center justify-center space-x-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                  <span>${t('pois.directions')}</span>
                </button>
              </div>
            </div>
          `);

        marker.setPopup(popup);
        favoriteMarkers.current.push(marker);
      }
    });
  };

  // Remove favorite function (called from popup)
  const removeFavorite = async (favoriteId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for removing favorite');
        return;
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      // Remove from cache using the hook function
      removeFavoriteFromCache(favoriteId);
      
      // Emit cache invalidation events
      cacheEventManager.emit(CACHE_EVENTS.FAVORITE_REMOVED);
      await invalidateFavoriteCaches(user.id);
      
      toast({
        title: t('favorites.removed'),
        description: t('favorites.removedMessage'),
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: t('favorites.error'),
        description: t('favorites.errorMessage'),
        variant: 'destructive',
      });
    }
  };

  // Add global function for popup buttons
  useEffect(() => {
    (window as any).removeFavorite = removeFavorite;
    (window as any).getFavoriteDirections = (favoriteId: number) => {
      const favorite = favorites.find(fav => fav.id === favoriteId);
      if (favorite) {
        getFavoriteDirections(favorite);
      }
    };
    return () => {
      delete (window as any).removeFavorite;
      delete (window as any).getFavoriteDirections;
    };
  }, [favorites]);

  // Add custom CSS for favorite popups and accordion touch handling
  useEffect(() => {
    // Inject custom CSS to hide default Mapbox popup styling and improve accordion touch handling
    const style = document.createElement('style');
    style.textContent = `
      .favorite-popup .mapboxgl-popup-content,
      .trip-popup .mapboxgl-popup-content,
      .poi-popup .mapboxgl-popup-content {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .favorite-popup .mapboxgl-popup-tip,
      .trip-popup .mapboxgl-popup-tip,
      .poi-popup .mapboxgl-popup-tip {
        display: none !important;
      }
      
      /* POI Marker specific styles - simplified for better positioning */
      .poi-marker {
        pointer-events: auto !important;
      }
      
      /* Ensure markers don't disappear on hover */
      .mapboxgl-marker {
        pointer-events: auto !important;
      }
      
      /* Improve accordion touch handling on mobile */
      [data-radix-accordion-trigger] {
        touch-action: manipulation !important;
        -webkit-tap-highlight-color: transparent !important;
        user-select: none !important;
      }
      
      /* Ensure accordion content is properly touchable */
      [data-radix-accordion-content] {
        touch-action: pan-y !important;
      }
      
      /* Prevent touch events from interfering with accordion on mobile */
      @media (max-width: 768px) {
        [data-radix-accordion-item] {
          touch-action: manipulation !important;
        }
        
        /* Ensure sidebar content is visible above mobile navbar */
        .sidebar-content {
          padding-bottom: 6rem !important;
          margin-bottom: 1rem !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update favorites on map when showFavorites changes
  useEffect(() => {
    if (map.current) {
      console.log('Favorites data changed, updating map markers. Count:', favorites.length);
      addFavoritesToMap();
    }
  }, [showFavorites, favorites, addFavoritesToMap]);

  // Debug logging for favorites data changes
  useEffect(() => {
    console.log('Favorites data updated in MapDashboard:', {
      count: favorites.length,
      favorites: favorites.map(f => ({ id: f.id, name: f.place_name }))
    });
  }, [favorites]);

  // Add POIs to map
  const addPOIsToMap = () => {
    if (!map.current) return;

    // Always clear existing POI markers first
    poiMarkers.current.forEach(marker => marker.remove());
    poiMarkers.current = [];

    // Only add markers if showPOIs is true
    if (!showPOIs) return;

    pois.forEach(poi => {
      if (poi.lat && poi.lng) {
        // Get category icon and color
        const getCategoryIcon = (categories: string[]) => {
          if (categories.includes('restaurant') || categories.includes('food')) {
            return '🍽️';
          } else if (categories.includes('hotel') || categories.includes('lodging')) {
            return '🏨';
          } else if (categories.includes('cafe') || categories.includes('coffee')) {
            return '☕';
          } else if (categories.includes('bar') || categories.includes('nightlife')) {
            return '🍺';
          } else if (categories.includes('museum') || categories.includes('art')) {
            return '🏛️';
          } else if (categories.includes('park') || categories.includes('nature')) {
            return '🌳';
          } else if (categories.includes('shopping') || categories.includes('store')) {
            return '🛍️';
          } else if (categories.includes('entertainment') || categories.includes('attraction')) {
            return '🎡';
          } else {
            return '📍';
          }
        };

        const getCategoryColor = (categories: string[]) => {
          if (categories.includes('restaurant') || categories.includes('food')) {
            return '#ef4444'; // Red
          } else if (categories.includes('hotel') || categories.includes('lodging')) {
            return '#3b82f6'; // Blue
          } else if (categories.includes('cafe') || categories.includes('coffee')) {
            return '#8b5cf6'; // Purple
          } else if (categories.includes('bar') || categories.includes('nightlife')) {
            return '#f59e0b'; // Amber
          } else if (categories.includes('museum') || categories.includes('art')) {
            return '#10b981'; // Emerald
          } else if (categories.includes('park') || categories.includes('nature')) {
            return '#059669'; // Green
          } else if (categories.includes('shopping') || categories.includes('store')) {
            return '#ec4899'; // Pink
          } else if (categories.includes('entertainment') || categories.includes('attraction')) {
            return '#f97316'; // Orange
          } else {
            return '#6b7280'; // Gray
          }
        };

        const categoryIcon = getCategoryIcon(poi.categories);
        const categoryColor = getCategoryColor(poi.categories);

        // Create custom marker element for POIs - using same logic as favorites but smaller size
        const el = document.createElement('div');
        el.className = 'poi-marker';
        el.setAttribute('data-marker-type', 'poi');
        el.style.width = '28px';
        el.style.height = '28px';
        el.style.background = categoryColor;
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '12px';
        el.style.transition = 'box-shadow 0.2s ease';

        // Use category image if available, otherwise fall back to emoji
        if (poi.category_image_url) {
          console.log('Creating marker with image for:', poi.name, 'Image URL:', poi.category_image_url);
          const img = document.createElement('img');
          img.src = poi.category_image_url;
          img.style.width = '20px';
          img.style.height = '20px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '50%';
          img.style.backgroundColor = 'white';
          img.style.padding = '2px';
          img.alt = poi.category_name || 'POI';
          img.style.transition = 'all 0.2s ease';
          img.onerror = () => {
            console.log('Image failed to load for:', poi.name, poi.category_image_url);
            // Fallback to emoji if image fails to load
            el.textContent = categoryIcon;
          };
          img.onload = () => {
            console.log('Image loaded successfully for:', poi.name);
          };
          el.appendChild(img);
        } else {
          console.log('Creating marker with emoji for:', poi.name, 'Category:', poi.category_name, 'Category ID:', poi.poi_category_id, 'Image URL:', poi.category_image_url);
          el.textContent = categoryIcon;
        }

        // Add rating display if there are reviews - positioned absolutely relative to the marker
        if (poi.average_rating && poi.average_rating > 0) {
          const ratingContainer = document.createElement('div');
          ratingContainer.style.position = 'absolute';
          ratingContainer.style.bottom = '-18px';
          ratingContainer.style.left = '50%';
          ratingContainer.style.transform = 'translateX(-50%)';
          ratingContainer.style.background = '#ffffff';
          ratingContainer.style.border = '1px solid #e5e7eb';
          ratingContainer.style.borderRadius = '8px';
          ratingContainer.style.padding = '2px 4px';
          ratingContainer.style.fontSize = '10px';
          ratingContainer.style.fontWeight = 'bold';
          ratingContainer.style.color = '#f59e0b';
          ratingContainer.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
          ratingContainer.style.whiteSpace = 'nowrap';
          ratingContainer.style.zIndex = '2';
          ratingContainer.style.transition = 'all 0.2s ease';
          
          // Format rating based on rating type
          let ratingText = '';
          if (poi.rating_type === 'out_of_5') {
            ratingText = `${poi.average_rating.toFixed(1)}/5★`;
          } else if (poi.rating_type === 'percentage') {
            ratingText = `${poi.average_rating.toFixed(0)}%★`;
          } else {
            // Default to out_of_10
            ratingText = `${poi.average_rating.toFixed(1)}/10★`;
          }
          
          ratingContainer.textContent = ratingText;
          
          el.appendChild(ratingContainer);
        }

        // Add hover effect - only change shadow and image size, no transform
        el.onmouseover = () => {
          el.style.zIndex = '10';
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          const img = el.firstChild as HTMLImageElement | null;
          if (img && img.tagName === 'IMG') {
            img.style.width = '24px';
            img.style.height = '24px';
          }
        };
        el.onmouseout = () => {
          el.style.zIndex = '1';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          const img = el.firstChild as HTMLImageElement | null;
          if (img && img.tagName === 'IMG') {
            img.style.width = '20px';
            img.style.height = '20px';
          }
        };

        // Create marker using same logic as favorites
        const marker = new mapboxgl.Marker(el)
          .setLngLat([poi.lng, poi.lat])
          .addTo(map.current);

        // Create popup content
        const popupContent = `
          <div class="p-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 max-w-xs">
            <div class="flex items-center space-x-2 mb-2">
              ${poi.category_image_url ? `
                <img src="${poi.category_image_url}" alt="${poi.category_name || 'POI'}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%;" />
              ` : `
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style="background: ${categoryColor}">
                  ${categoryIcon}
                </div>
              `}
              <h3 class="font-semibold text-sm text-gray-900 truncate">${poi.name}</h3>
            </div>
            <p class="text-xs text-gray-600 mb-2 truncate">${poi.address}</p>
            ${poi.average_rating && poi.average_rating > 0 ? `
              <div class="flex items-center space-x-1 mb-2">
                <span class="text-yellow-500 text-xs">★</span>
                <span class="text-xs text-gray-600">${poi.average_rating.toFixed(1)}/10</span>
                
              </div>
            ` : ''}
            ${poi.description ? `
              <p class="text-xs text-gray-600 mb-2 line-clamp-2">${poi.description}</p>
            ` : ''}
            ${poi.category_name ? `
              <div class="flex items-center space-x-1 mb-2">
                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="text-xs text-gray-500">${poi.category_name}</span>
              </div>
            ` : ''}
            <div class="flex space-x-2">
              ${poi.url ? `
                <button class="visit-btn flex-1 text-xs bg-blue-500/90 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1" data-url="${poi.url}">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  <span>${t('pois.visit')}</span>
                </button>
              ` : ''}
              <button class="directions-btn flex-1 text-xs bg-green-500/90 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors flex items-center justify-center space-x-1" data-lat="${poi.lat}" data-lng="${poi.lng}" data-name="${poi.name}">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                <span>${t('pois.directions')}</span>
              </button>
            </div>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          className: 'poi-popup'
        }).setHTML(popupContent);

        // Set popup on marker
        marker.setPopup(popup);

        // Add click handler to marker element
        marker.getElement().addEventListener('click', () => {
          // Close current popup if exists
          if (currentPopup.current) {
            currentPopup.current.remove();
          }
          // Set new current popup
          currentPopup.current = popup;
        });

        // Add event listener for popup close
        popup.on('close', () => {
          if (currentPopup.current === popup) {
            currentPopup.current = null;
          }
        });

        // Add event listeners for popup buttons after popup is opened
        popup.on('open', () => {
          const popupElement = popup.getElement();
          if (popupElement) {
            // Handle visit button
            const visitBtn = popupElement.querySelector('.visit-btn');
            if (visitBtn) {
              visitBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = visitBtn.getAttribute('data-url');
                if (url) {
                  window.open(url, '_blank');
                }
              });
            }

            // Handle directions button
            const directionsBtn = popupElement.querySelector('.directions-btn');
            if (directionsBtn) {
              directionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lat = directionsBtn.getAttribute('data-lat');
                const lng = directionsBtn.getAttribute('data-lng');
                const name = directionsBtn.getAttribute('data-name');
                if (lat && lng && name) {
                  handlePOIDirectionsClick(lat, lng, name);
                }
              });
            }
          }
        });

        poiMarkers.current.push(marker);
      }
    });
  };

  // Handle POI review click
  const handlePOIReviewClick = (poiId: string) => {
    const poi = pois.find(p => p.id === poiId);
    if (poi) {
      setSelectedPOI(poi);
      setIsReviewDialogOpen(true);
    }
  };

  // Add global function for POI review popup buttons
  useEffect(() => {
    (window as any).openPOIReview = handlePOIReviewClick;
    return () => {
      delete (window as any).openPOIReview;
    };
  }, [pois]);

  // Function to get category from place types
  const getFavoriteCategory = (placeTypes: string[] | null | undefined): string => {
    // Handle null/undefined placeTypes
    if (!placeTypes || !Array.isArray(placeTypes)) {
      return 'other';
    }
    
    if (placeTypes.includes('restaurant') || placeTypes.includes('food')) {
      return 'restaurant';
    } else if (placeTypes.includes('hotel') || placeTypes.includes('lodging')) {
      return 'hotel';
    } else if (placeTypes.includes('cafe') || placeTypes.includes('coffee')) {
      return 'cafe';
    } else if (placeTypes.includes('bar') || placeTypes.includes('nightlife')) {
      return 'bar';
    } else if (placeTypes.includes('museum') || placeTypes.includes('art')) {
      return 'museum';
    } else if (placeTypes.includes('park') || placeTypes.includes('nature')) {
      return 'park';
    } else if (placeTypes.includes('shopping') || placeTypes.includes('store')) {
      return 'shopping';
    } else if (placeTypes.includes('entertainment') || placeTypes.includes('attraction')) {
      return 'entertainment';
    } else {
      return 'other';
    }
  };

  // Update POIs on map when showPOIs changes
  useEffect(() => {
    if (map.current) {
      addPOIsToMap();
    }
  }, [showPOIs, pois, addPOIsToMap]);

  // Group favorites by category
  const groupedFavorites = favorites.reduce((acc, favorite) => {
    const category = getFavoriteCategory(favorite.place_types);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(favorite);
    return acc;
  }, {} as Record<string, FavoritePlace[]>);

  // Group trips by city when "All" filter is selected
  // For ZapRoad trips, we use the arrival city (end_city) instead of departure city (starting_city)
  const groupedTripsByCity = trips.reduce((acc, trip) => {
    const city = trip.location || 'Unknown Location';
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(trip);
    return acc;
  }, {} as Record<string, TripData[]>);

  // Sort cities alphabetically
  const sortedCities = Object.keys(groupedTripsByCity).sort((a, b) => {
    if (a === 'Unknown Location') return 1;
    if (b === 'Unknown Location') return -1;
    return a.localeCompare(b);
  });

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant':
        return <UtensilsCrossed className="w-4 h-4" />;
      case 'hotel':
        return <Hotel className="w-4 h-4" />;
      case 'cafe':
        return <Coffee className="w-4 h-4" />;
      case 'bar':
        return <Wine className="w-4 h-4" />;
      case 'museum':
        return <Landmark className="w-4 h-4" />;
      case 'park':
        return <TreePine className="w-4 h-4" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4" />;
      case 'entertainment':
        return <Palette className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  // Function to get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'restaurant':
        return 'bg-red-500';
      case 'hotel':
        return 'bg-blue-500';
      case 'cafe':
        return 'bg-purple-500';
      case 'bar':
        return 'bg-amber-500';
      case 'museum':
        return 'bg-emerald-500';
      case 'park':
        return 'bg-green-500';
      case 'shopping':
        return 'bg-pink-500';
      case 'entertainment':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Function to get category display name
  const getCategoryDisplayName = (category: string) => {
    return t(`favorites.categories.${category}`, { defaultValue: t('favorites.categories.other') });
  };

    // Function to fly to favorite location
  const flyToFavorite = (favorite: FavoritePlace) => {
    if (!map.current || !favorite.place_lat || !favorite.place_lng) return;
    
    // Fly to the location with animation
    map.current.flyTo({
      center: [favorite.place_lng, favorite.place_lat],
      zoom: 15,
      duration: 2000,
      essential: true
    });

    // Add a bounce effect to the favorite marker
    const favoriteMarker = favoriteMarkers.current.find(marker => {
      const lngLat = marker.getLngLat();
      return lngLat.lng === favorite.place_lng && lngLat.lat === favorite.place_lat;
    });

    if (favoriteMarker) {
      // Create bounce animation
      const bounce = () => {
        favoriteMarker.getElement().style.transform = 'scale(1.2)';
        setTimeout(() => {
          favoriteMarker.getElement().style.transform = 'scale(1)';
        }, 200);
      };
      bounce();
    }
  };

  // Function to get directions to favorite using address
  const getFavoriteDirections = (favorite: FavoritePlace) => {
    // Use the place address for navigation
    const destinationAddress = favorite.place_address || favorite.place_name;
    
    if (!destinationAddress) {
      console.error('No address information available for directions', favorite);
      return;
    }

    // Create Google Maps URL with address
    const encodedAddress = encodeURIComponent(destinationAddress);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    // Check if we're on mobile and can use the Google Maps app
    if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
      // Try to open Google Maps app first
      const googleMapsAppUrl = `comgooglemaps://?q=${encodedAddress}`;
      
      // Create a hidden iframe to test if the app is available
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = googleMapsAppUrl;
      
      // Set a timeout to fallback to web version
      const timeout = setTimeout(() => {
        window.open(googleMapsUrl, '_blank');
      }, 1000);
      
      // If the app opens, clear the timeout
      iframe.onload = () => {
        clearTimeout(timeout);
      };
      
      document.body.appendChild(iframe);
      
      // Remove the iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    } else {
      // On desktop, open in new tab
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Handle POI directions click
  const handlePOIDirectionsClick = (lat: string, lng: string, name: string) => {
    // Open Google Maps directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Add global function for POI directions popup buttons
  useEffect(() => {
    (window as any).openDirections = handlePOIDirectionsClick;
    return () => {
      delete (window as any).openDirections;
    };
  }, []);

  return (
    <>


      <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
        <div 
          ref={mapContainer} 
          className="absolute inset-0 bg-gray-100"
          style={{ touchAction: 'none', background: '#fcfcfc' }}
        />
        
        {/* Rest of the existing map components */}
        <MapSearch 
          map={map}
          onLocationSelect={handleLocationSelect}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">{t('loading')}</p>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
              <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* Map style and location buttons */}
        <div className={cn(
          "absolute z-10 flex flex-col gap-2",
          isMobile ? "top-32 right-4" : "top-4 right-16"
        )}>
          <button
            className={cn(
              "p-2 rounded-full shadow-md bg-white hover:bg-gray-100 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Find my location"
            onClick={handleGeolocate}
            disabled={isLocating}
          >
            <Crosshair className={cn(
              "w-5 h-5 text-gray-700",
              isLocating && "animate-spin"
            )} />
          </button>
          <button
            className={cn(
              "p-2 rounded-full shadow-md bg-white hover:bg-gray-100 transition-colors",
              mapStyle === 'mapbox://styles/mapbox/streets-v12' && "ring-2 ring-blue-500"
            )}
            title="Streets view"
            onClick={() => changeMapStyle('mapbox://styles/mapbox/streets-v12')}
          >
            <Layers className="w-5 h-5 text-gray-700" />
          </button>
          <button
            className={cn(
              "p-2 rounded-full shadow-md bg-white hover:bg-gray-100 transition-colors",
              mapStyle === 'mapbox://styles/mapbox/outdoors-v12' && "ring-2 ring-green-500"
            )}
            title="Nature view"
            onClick={() => changeMapStyle('mapbox://styles/mapbox/outdoors-v12')}
          >
            <Mountain className="w-5 h-5 text-gray-700" />
          </button>
          <button
            className={cn(
              "p-2 rounded-full shadow-md bg-white hover:bg-gray-100 transition-colors",
              mapStyle === 'mapbox://styles/mapbox/satellite-streets-v12' && "ring-2 ring-purple-500"
            )}
            title="Satellite view"
            onClick={() => changeMapStyle('mapbox://styles/mapbox/satellite-streets-v12')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
              <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
              <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
              <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
            </svg>
          </button>
          <button
            className={cn(
              "p-2 rounded-full shadow-md bg-white hover:bg-gray-100 transition-colors",
              showFavorites && "ring-2 ring-red-500"
            )}
            title={t('favorites.toggle')}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Heart className={cn(
              "w-5 h-5",
              showFavorites ? "text-red-500 fill-red-500" : "text-gray-700"
            )} />
          </button>
          <button
            className={cn(
              "p-2 rounded-full shadow-md bg-white hover:bg-gray-100 transition-colors",
              showPOIs && "ring-2 ring-green-500"
            )}
            title={t('pois.toggle')}
            onClick={() => setShowPOIs(!showPOIs)}
          >
            <Map className={cn(
              "w-5 h-5",
              showPOIs ? "text-green-500" : "text-gray-700"
            )} />
          </button>
        </div>
        
        {/* Mobile sidebar toggle button - only visible when sidebar is closed */}
        {isMobile && !sidebarVisible && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-50">
            <button
              onClick={() => setSidebarVisible(true)}
              className="bg-white rounded-r-lg shadow-lg border border-gray-200 p-3 flex items-center justify-center"
              aria-label="Open sidebar"
            >
              <ChevronRight className="w-7 h-7 text-gray-700" />
            </button>
          </div>
        )}
        
        {/* Travel mode selector (show only when a zaproad route is selected) */}
        {selectedTrip?.type === 'zaproad' && (
          <div className={cn(
            "absolute bottom-4 z-10 bg-white/90 rounded-lg shadow-md p-2",
            isMobile ? "right-4 left-4 flex justify-center" : "right-4"
          )}>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Route type:</p>
              <div className="flex gap-1">
                <button
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    travelMode === 'driving' ? "bg-green-600 text-white" : "bg-white text-gray-700"
                  )}
                  onClick={() => {
                    setTravelMode('driving');
                    if (selectedTrip) displayCachedCheckpoints(selectedTrip);
                  }}
                >
                  Driving
                </button>
                <button
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    travelMode === 'walking' ? "bg-green-600 text-white" : "bg-white text-gray-700"
                  )}
                  onClick={() => {
                    setTravelMode('walking');
                    if (selectedTrip) displayCachedCheckpoints(selectedTrip);
                  }}
                >
                  Walking
                </button>
                <button
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    travelMode === 'cycling' ? "bg-green-600 text-white" : "bg-white text-gray-700"
                  )}
                  onClick={() => {
                    setTravelMode('cycling');
                    if (selectedTrip) displayCachedCheckpoints(selectedTrip);
                  }}
                >
                  Cycling
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating sidebar with responsive handling */}
      <div 
        className={cn(
          "absolute top-0 left-0 h-full bg-white/90 backdrop-blur-sm shadow-lg z-30 overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
          isMobile 
            ? sidebarVisible 
              ? "w-full md:w-80 translate-x-0" 
              : "w-0 -translate-x-full"
            : "w-80 translate-x-0"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sidebar header with mobile close button */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
            {isMobile && sidebarVisible && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSidebarVisible(false);
                }}
                className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                aria-label="Close sidebar"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            )}
          </div>
          
          {/* Filter buttons */}
          <div className={cn(
            "flex flex-wrap gap-2 mt-5",
            isMobile && "justify-center"
          )}>
            <button 
              onClick={() => setActiveFilter(null)}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors",
                !activeFilter 
                  ? "bg-gray-800 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('zapout')}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors flex items-center",
                activeFilter === 'zapout'
                  ? "bg-emerald-600 text-white" 
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              )}
            >
              <CableCar className="w-3 h-3 mr-1" />
              Zapout
            </button>
            <button 
              onClick={() => setActiveFilter('zaproad')}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors flex items-center",
                activeFilter === 'zaproad'
                  ? "bg-amber-600 text-white" 
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              )}
            >
              <Car className="w-3 h-3 mr-1" />
              Zaproad
            </button>
            <button 
              onClick={() => setActiveFilter('zaptrip')}
              className={cn(
                "px-3 py-1 text-xs rounded-full transition-colors flex items-center",
                activeFilter === 'zaptrip'
                  ? "bg-sky-600 text-white" 
                  : "bg-sky-100 text-sky-700 hover:bg-sky-200"
              )}
            >
              <PlaneTakeoff className="w-3 h-3 mr-1" />
              Zaptrip
            </button>
          </div>
        </div>
        
        <div className={cn(
          "flex-1 overflow-y-auto p-2 sidebar-content",
          isMobile && "pb-24" // Add bottom padding on mobile to account for navbar
        )}>
          {/* Trip cards */}
          <AnimatePresence>
            {activeFilter ? (
              // Show filtered trips (by type)
              trips.filter(t => t.type === activeFilter).map((trip) => (
                <motion.div
                  key={`${trip.type}-${trip.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "mb-3 p-3 rounded-lg shadow-sm cursor-pointer transition-all",
                    selectedTrip?.id === trip.id && selectedTrip?.type === trip.type
                      ? "ring-2 bg-white"
                      : "bg-white/70 hover:bg-white",
                    trip.type === 'zapout' && "ring-emerald-500 hover:ring-1",
                    trip.type === 'zaproad' && "ring-amber-500 hover:ring-1",
                    trip.type === 'zaptrip' && "ring-sky-500 hover:ring-1"
                  )}
                  onClick={() => handleTripClick(trip)}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white",
                        trip.type === 'zapout' && "bg-emerald-500",
                        trip.type === 'zaproad' && "bg-amber-500",
                        trip.type === 'zaptrip' && "bg-sky-500"
                      )}
                    >
                      {trip.type === 'zapout' && <CableCar className="w-5 h-5" />}
                      {trip.type === 'zaproad' && <Car className="w-5 h-5" />}
                      {trip.type === 'zaptrip' && <PlaneTakeoff className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{trip.title}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {trip.type === 'zaproad' && trip.starting_city && trip.end_city 
                          ? `${trip.starting_city} → ${trip.end_city}`
                          : trip.location || 'No location'
                        }
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {new Date(trip.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(trip);
                            }}
                            title="View Details"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTripClick(trip);
                            }}
                            title="Show on Map"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Show trips grouped by city when "All" is selected
              <Accordion 
                type="multiple" 
                className="w-full"
                value={expandedCities}
                onValueChange={setExpandedCities}
              >
                {sortedCities.map((city) => (
                  <AccordionItem key={city} value={city} className="border-none">
                    <AccordionTrigger 
                      className="px-3 py-3 hover:no-underline hover:bg-gray-50 rounded-lg transition-colors touch-manipulation min-h-[44px] w-full text-left"
                      style={{ 
                        minHeight: '44px',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-gray-700 text-sm">{city}</span>
                          <span className="text-xs text-gray-500 ml-2">({groupedTripsByCity[city].length})</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2" style={{ touchAction: 'pan-y' }}>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {groupedTripsByCity[city].map((trip) => (
                            <motion.div
                              key={`${trip.type}-${trip.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                "p-3 rounded-lg shadow-sm cursor-pointer transition-all",
                                selectedTrip?.id === trip.id && selectedTrip?.type === trip.type
                                  ? "ring-2 bg-white"
                                  : "bg-white/70 hover:bg-white",
                                trip.type === 'zapout' && "ring-emerald-500 hover:ring-1",
                                trip.type === 'zaproad' && "ring-amber-500 hover:ring-1",
                                trip.type === 'zaptrip' && "ring-sky-500 hover:ring-1"
                              )}
                              onClick={() => handleTripClick(trip)}
                            >
                              <div className="flex items-start gap-3">
                                <div 
                                  className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-white",
                                    trip.type === 'zapout' && "bg-emerald-500",
                                    trip.type === 'zaproad' && "bg-amber-500",
                                    trip.type === 'zaptrip' && "bg-sky-500"
                                  )}
                                >
                                  {trip.type === 'zapout' && <CableCar className="w-5 h-5" />}
                                  {trip.type === 'zaproad' && <Car className="w-5 h-5" />}
                                  {trip.type === 'zaptrip' && <PlaneTakeoff className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate">{trip.title}</h3>
                                  <p className="text-sm text-gray-500 truncate">
                                    {trip.type === 'zaproad' && trip.starting_city && trip.end_city 
                                      ? `${trip.starting_city} → ${trip.end_city}`
                                      : trip.location || 'No location'
                                    }
                                  </p>
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">
                                      {new Date(trip.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-xs h-7 w-7 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewDetails(trip);
                                        }}
                                        title="View Details"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                        </svg>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-xs h-7 w-7 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTripClick(trip);
                                        }}
                                        title="Show on Map"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                                        </svg>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </AnimatePresence>
          
          {/* Favorites section */}
          {favorites.length > 0 && (
            <div className={cn(
              "mt-6 border-t pt-4",
              isMobile && "mb-8" // Add extra margin bottom on mobile
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-gray-900">{t('favorites.title')}</h3>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  {favorites.length}
                </span>
              </div>
              
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedFavorites).map(([category, categoryFavorites]) => (
                  <AccordionItem key={category} value={category} className="border-none">
                    <AccordionTrigger 
                      className="px-3 py-3 hover:no-underline hover:bg-gray-50 rounded-lg transition-colors touch-manipulation min-h-[44px] w-full text-left"
                      style={{ 
                        minHeight: '44px',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", getCategoryColor(category))}>
                          {getCategoryIcon(category)}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium text-gray-900">{getCategoryDisplayName(category)}</span>
                          <span className="text-xs text-gray-500 ml-2">({categoryFavorites.length})</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2" style={{ touchAction: 'pan-y' }}>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {categoryFavorites.map((favorite) => (
                            <motion.div
                              key={favorite.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.2 }}
                              className="p-3 rounded-lg shadow-sm bg-white/70 hover:bg-white transition-all border border-gray-100 cursor-pointer hover:shadow-md"
                              onClick={() => flyToFavorite(favorite)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                                  <Heart className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate text-sm">{favorite.place_name}</h4>
                                  <p className="text-xs text-gray-500 truncate">
                                    {favorite.place_address}
                                  </p>
                                  {favorite.place_rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-yellow-500 text-xs">★</span>
                                      <span className="text-xs text-gray-600">{favorite.place_rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                  <div className="mt-2 flex gap-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(createExternalPlaceUrl(favorite.place_id, favorite.place_name, 'en'), '_blank');
                                      }}
                                      title={t('favorites.viewDetails')}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                      </svg>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs h-6 w-6 p-0 text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        getFavoriteDirections(favorite);
                                      }}
                                      title={t('pois.directions')}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                                      </svg>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs h-6 w-6 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFavorite(favorite.id);
                                      }}
                                      title={t('favorites.remove')}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                      </svg>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
          
          {/* Empty state */}
          {trips.length === 0 && !isLoading && (
            <div className={cn(
              "flex flex-col items-center justify-center p-6 h-60",
              isMobile && "mb-8" // Add extra margin bottom on mobile
            )}>
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <CableCar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No trips found</h3>
              <p className="text-sm text-gray-500 text-center">
                Start by creating a new adventure
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POI Review Dialog */}
      <POIReviewDialog
        poi={selectedPOI}
        isOpen={isReviewDialogOpen}
        onClose={() => {
          setIsReviewDialogOpen(false);
          setSelectedPOI(null);
        }}
        onSubmit={async (poiId, rating, notes) => {
          await addPOIReview(poiId, rating, notes);
        }}
      />
    </>
  );
};

export default MapDashboard;
