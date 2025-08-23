import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Building, Store, Navigation, Home, Coffee, UtensilsCrossed, Car, CircleDollarSign, Pill, ShoppingBag, Wine, Hotel, Dumbbell, Wrench, Film, Landmark, Palette, Filter, Heart, Share, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import ReactDOMServer from 'react-dom/server';
import { usePOIs, POI } from '@/hooks/usePOIs';
import { supabase } from '@/integrations/supabase/client';
import { openGoogleMapsNavigation } from '@/utils/navigation';

interface MapSearchProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  onLocationSelect?: (location: any) => void;
  onSaveToFavorites?: (location: EnhancedSearchResult) => void;
  onGetDirections?: (location: EnhancedSearchResult) => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  properties: {
    category?: string;
    maki?: string;
    distance?: number;
    source?: string;
    isNearest?: boolean;
    coordinates?: [number, number];
    lat?: number;
    lng?: number;
    center?: [number, number];
  };
  text: string;
  name?: string;
  distance?: number;
}

interface SuggestedFeature {
  id: string;
  type: string;
  place_type: string[];
  place_name: string;
  text: string;
  center?: [number, number];
  name: string;
  address?: string;
  full_address?: string;
  properties: {
    category?: string;
    maki?: string;
    feature_type?: string;
    coordinates?: [number, number];
    feature_score?: number;
    matching_name?: string;
    matching_place_name?: string;
    address?: string;
    distance?: number;
    isLocationPOI?: boolean;
    source?: string;
    isNearest?: boolean;
    // POI specific properties
    poi_data?: POI;
    review_author?: string;
    review_text?: string;
    review_rating?: number;
  };
  geometry?: {
    coordinates: [number, number];
    type: string;
  };
  action?: {
    endpoint: string;
    method: string;
    body: {
      id: string;
      sessionToken: string;
      [key: string]: any;
    };
  };
}

interface CategoryButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  query: string;
}

interface SearchFilters {
  priceRange?: 'low' | 'medium' | 'high';
  rating?: number;
  openNow?: boolean;
  accessibility?: boolean;
}

interface EnhancedSearchResult extends SearchResult {
  rating?: number;
  priceLevel?: number;
  openingHours?: {
    open: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
  };
  photos?: string[];
  reviews?: Array<{
    rating: number;
    text: string;
    author: string;
  }>;
  // POI specific properties
  poi_data?: POI;
  review_author?: string;
  review_text?: string;
  review_rating?: number;
  // Geometry for geocoding results
  geometry?: {
    coordinates: [number, number];
    type: string;
  };
  // Address properties
  full_address?: string;
  address?: string;
}

// Helper function to format distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

  // Map poi category to icon and color (matching MapDashboard styling)
const getCategoryIcon = (category: string | undefined, placeType: string[]) => {
  if (placeType.includes('address')) {
    return <Home className="w-4 h-4 text-gray-500" />;
  }
  
  if (placeType.includes('poi')) {
    if (!category) return <MapPin className="w-4 h-4 text-red-500" />;
    
    switch (category) {
      case 'restaurant':
      case 'cafe':
      case 'food':
        return <Store className="w-4 h-4 text-orange-500" />;
      case 'hotel':
      case 'lodging':
        return <Building className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-red-500" />;
    }
  }
  
  return <MapPin className="w-4 h-4 text-purple-500" />;
};

// Get category color (matching MapDashboard)
const getCategoryColor = (category: string | undefined, placeType: string[]) => {
  if (placeType.includes('address')) {
   
  }
  
  if (placeType.includes('poi')) {
    if (!category) return '#ef4444'; // Red
    
    switch (category) {
      case 'restaurant':
      case 'food':
       
      case 'cafe':
      case 'coffee':
       
      case 'hotel':
      case 'lodging':
        
      case 'bar':
      case 'nightlife':
        
      case 'museum':
      case 'art':
       
      case 'park':
      case 'nature':
       
      case 'shopping':
      case 'store':
       
      case 'entertainment':
      case 'attraction':
        
      default:
        
    }
  }
  
  
};

// Get category emoji (matching MapDashboard)
const getCategoryEmoji = (category: string | undefined, placeType: string[]) => {
  if (placeType.includes('address')) {
    return '🏠';
  }
  
  if (placeType.includes('poi')) {
    if (!category) return '📍';
    
    switch (category) {
      case 'restaurant':
        return '🍽️';
      case 'food':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'coffee':
        return '☕';
      case 'hotel':
        return '🏨';
      case 'lodging':
        return '🏨';
      case 'bar':
      case 'nightlife':
        return '🍺';
      case 'museum':
      case 'art':
        return '🏛️';
      case 'park':
      case 'nature':
        return '🌳';
      case 'shopping':
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

export const MapSearch: React.FC<MapSearchProps> = ({ 
  map, 
  onLocationSelect,
  onSaveToFavorites,
  onGetDirections 
}) => {
  const { t } = useTranslation(['navigation']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SuggestedFeature[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'favorites'>('categories');
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const accessToken = 'pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ';
  const sessionToken = useRef(uuidv4());
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<EnhancedSearchResult | null>(null);
  const [favorites, setFavorites] = useState<EnhancedSearchResult[]>([]);
  const [fuzzyPoiMatches, setFuzzyPoiMatches] = useState<EnhancedSearchResult[]>([]);
  const [showingFuzzyCategory, setShowingFuzzyCategory] = useState(false);

  // Add POI hook
  const { pois } = usePOIs();

  // Add mousedown handler to prevent UI from closing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Define category buttons with unique IDs
  const categoryButtons = [
    { id: 'food-place', label: t('search.categories.food', 'Food'), icon: <UtensilsCrossed className="w-5 h-5" />, query: 'food' },
    { id: 'cafe-spot', label: t('search.categories.cafe', 'Cafe'), icon: <Coffee className="w-5 h-5" />, query: 'cafe' },
    { id: 'bar-pub', label: t('search.categories.bars', 'Bars'), icon: <Wine className="w-5 h-5" />, query: 'bar' },
    { id: 'shopping-mall', label: t('search.categories.shopping', 'Shopping'), icon: <ShoppingBag className="w-5 h-5" />, query: 'mall' },
  ];

  // Define list items for categories with unique IDs
  const categoryList = [
    { id: 'hotel-lodging', label: t('search.categories.hotels', 'Hotels'), icon: <Hotel className="w-5 h-5" />, query: 'hotel' },
    { id: 'attractions', label: t('search.categories.attractions', 'Attractions'), icon: <MapPin className="w-5 h-5" />, query: 'attractions' },
    { id: 'landmark', label: t('search.categories.landmarks', 'Landmarks'), icon: <Landmark className="w-5 h-5" />, query: 'landmark' },
    { id: 'museum', label: t('search.categories.museums', 'Museums'), icon: <Palette className="w-5 h-5" />, query: 'museum' },
    { id: 'cinema-theater', label: t('search.categories.cinemas', 'Cinemas'), icon: <Film className="w-5 h-5" />, query: 'cinema' },
    { id: 'parking-spot', label: t('search.categories.parking', 'Parking'), icon: <Car className="w-5 h-5" />, query: 'parking' },
    { id: 'pharmacy-store', label: t('search.categories.pharmacies', 'Pharmacies'), icon: <Pill className="w-5 h-5" />, query: 'pharmacy' },
    { id: 'grocery-store', label: t('search.categories.groceries', 'Groceries'), icon: <ShoppingBag className="w-5 h-5" />, query: 'grocery' },
    { id: 'gas-station', label: t('search.categories.gas', 'Gas'), icon: <Car className="w-5 h-5" />, query: 'gas station' },
  ];

  // Also update the categoryQueries to include the new categories
  const categoryQueries: Record<string, string> = {
    'food': 'restaurant',
    'cafe': 'cafe',
    'bar': 'bar pub',
    'mall': 'shopping mall',
    'hotel': 'hotel lodging',
    'attractions': 'tourist attractions points of interest',
    'landmark': 'landmark monument',
    'museum': 'museum gallery',
    'cinema': 'cinema movie theater',
    'parking': 'parking',
    'pharmacy': 'pharmacy',
    'grocery': 'supermarket grocery',
    'gas station': 'gas station fuel'
  };

  useEffect(() => {
    return () => {
      clearSearchMarkers();
    };
  }, []);

  useEffect(() => {
    const savedSearches = localStorage.getItem('recentMapSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('mapFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  const clearSearchMarkers = () => {
    searchMarkersRef.current.forEach(marker => marker.remove());
    searchMarkersRef.current = [];
  };

  // Add filter handlers
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Search POIs in database
  const searchPOIs = async (query: string): Promise<EnhancedSearchResult[]> => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase();
    const results: EnhancedSearchResult[] = [];
    
    // Get current map center for distance calculations
    const mapCenter = map.current?.getCenter();
    const currentLat = mapCenter?.lat || 0;
    const currentLng = mapCenter?.lng || 0;

    try {
      // Fetch all POIs and filter in JavaScript for better reliability
      const { data: poiResults, error } = await supabase
        .from('pois')
        .select(`
          *,
          poi_categories!poi_category_id (
            name,
            image_url
          ),
          poi_reviews (
            rating,
            rating_type,
            notes,
            user_id
          )
        `)
        .limit(50); // Fetch more POIs to filter from

      if (error) {
        console.error('Error searching POIs:', error);
        return [];
      }

      // Process POI results and filter by search term
      (poiResults || []).forEach((poi: any) => {
        // Check if POI matches the search query
        const nameMatch = poi.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = poi.description?.toLowerCase().includes(searchTerm);
        const categoryMatch = poi.categories?.some((cat: string) => 
          cat.toLowerCase().includes(searchTerm)
        );
        const categoryNameMatch = poi.poi_categories?.name?.toLowerCase().includes(searchTerm);
        
        // Check review content matches (notes and author)
        const reviewMatches = poi.poi_reviews?.filter((review: any) => {
          const notesMatch = review.notes?.toLowerCase().includes(searchTerm);
          const authorMatch = review.user_id?.toLowerCase().includes(searchTerm);
          return notesMatch || authorMatch;
        }) || [];

        if (nameMatch || descriptionMatch || categoryMatch || categoryNameMatch || reviewMatches.length > 0) {
          // Calculate average rating
          let averageRating = 0;
          let reviewCount = 0;
          let ratingType: 'out_of_10' | 'out_of_5' | 'percentage' | undefined;
          
          if (poi.poi_reviews && poi.poi_reviews.length > 0) {
            const ratingTypeCounts = {
              out_of_10: 0,
              out_of_5: 0,
              percentage: 0
            };
            
            poi.poi_reviews.forEach((review: any) => {
              ratingTypeCounts[review.rating_type]++;
            });
            
            const maxCount = Math.max(ratingTypeCounts.out_of_10, ratingTypeCounts.out_of_5, ratingTypeCounts.percentage);
            if (ratingTypeCounts.out_of_10 === maxCount) {
              ratingType = 'out_of_10';
            } else if (ratingTypeCounts.out_of_5 === maxCount) {
              ratingType = 'out_of_5';
            } else {
              ratingType = 'percentage';
            }
            
            const reviewsInMainType = poi.poi_reviews.filter((review: any) => review.rating_type === ratingType);
            if (reviewsInMainType.length > 0) {
              const totalRating = reviewsInMainType.reduce((sum: number, review: any) => sum + review.rating, 0);
              averageRating = totalRating / reviewsInMainType.length;
            }
            
            reviewCount = poi.poi_reviews.length;
          }

          // Calculate distance from current map center
          const distance = mapCenter ? calculateDistance(currentLat, currentLng, poi.lat, poi.lng) : undefined;
          const isNearest = distance && distance <= 75000; // Mark as nearest if within 75km
          
          // Create POI result as EnhancedSearchResult
          const poiResult: EnhancedSearchResult = {
            id: `poi-${poi.id}`,
            place_name: poi.address && poi.address !== poi.name ? poi.address : '', // Only use address if different from name
            center: [poi.lng, poi.lat],
            place_type: ['poi'],
            properties: {
              category: poi.poi_categories?.name || poi.categories?.[0] || 'poi',
              maki: 'marker',
              distance: distance,
              source: 'database_poi',
              isNearest: isNearest
            },
            text: poi.name, // Main title
            name: poi.name,
            distance: distance,
            poi_data: {
              id: poi.id,
              name: poi.name,
              url: poi.url,
              description: poi.description && poi.description.trim() && poi.description !== '0' ? poi.description : undefined,
              address: poi.address,
              lat: poi.lat,
              lng: poi.lng,
              categories: poi.categories || [],
              poi_category_id: poi.poi_category_id,
              created_at: poi.created_at,
              updated_at: poi.updated_at,
              category_name: poi.poi_categories?.name,
              category_image_url: poi.poi_categories?.image_url,
              average_rating: averageRating > 0 ? averageRating : undefined,
              review_count: reviewCount > 0 ? reviewCount : undefined,
              rating_type: ratingType,
            }
          };

          // If there are review matches, add review information
          if (reviewMatches.length > 0) {
            const matchingReview = reviewMatches[0]; // Take the first matching review
            poiResult.review_author = matchingReview.user_id ? `User ${matchingReview.user_id.slice(0, 8)}` : 'Anonymous';
            poiResult.review_text = matchingReview.notes && matchingReview.notes.trim() ? matchingReview.notes.trim() : ''; // Add the review text
            poiResult.review_rating = matchingReview.rating && matchingReview.rating > 0 ? matchingReview.rating : undefined;
          }

          results.push(poiResult);
        }
      });

      // Sort results by distance and prioritize POIs within 75km
      const sortedResults = results.sort((a, b) => {
        const distanceA = a.distance || Infinity;
        const distanceB = b.distance || Infinity;
        
        // If both are within 75km, sort by distance
        if (distanceA <= 75000 && distanceB <= 75000) {
          return distanceA - distanceB;
        }
        
        // If only A is within 75km, prioritize A
        if (distanceA <= 75000 && distanceB > 75000) {
          return -1;
        }
        
        // If only B is within 75km, prioritize B
        if (distanceB <= 75000 && distanceA > 75000) {
          return 1;
        }
        
        // If both are outside 75km, sort by distance
        return distanceA - distanceB;
      });
      
      // Limit results to top 10 matches
      return sortedResults.slice(0, 10);
    } catch (error) {
      console.error('Error searching POIs:', error);
      return [];
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setShowingFuzzyCategory(false); // Reset on new search
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setFuzzyPoiMatches([]);
      clearSearchMarkers();
      return;
    }
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const mapCenter = map.current?.getCenter();
        const searchUrl = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
        const geocodingUrl = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places');

        // Adjust query for category searches
        let searchQuery = query.trim();
        
        if (categoryQueries[searchQuery.toLowerCase()]) {
          searchQuery = categoryQueries[searchQuery.toLowerCase()];
        }

        // Search POIs in database first
        const poiResults = await searchPOIs(query);
        setFuzzyPoiMatches(poiResults.length > 0 ? poiResults : []);

        // Convert POI results to SuggestedFeature format
        const poiSuggestions: SuggestedFeature[] = poiResults.map(poi => {
          const suggestion: SuggestedFeature = {
            id: poi.id,
            type: 'poi',
            place_type: poi.place_type,
            place_name: poi.place_name,
            text: poi.text,
            center: poi.center,
            name: poi.name,
            address: poi.poi_data?.address,
            full_address: poi.poi_data?.address,
            properties: {
              ...poi.properties,
              poi_data: poi.poi_data,
              review_author: poi.review_author,
              review_text: poi.review_text,
              review_rating: poi.review_rating,
              distance: poi.distance, // Ensure distance is passed through
              isNearest: poi.properties?.isNearest, // Pass through nearest flag
            }
          };
          
          return suggestion;
        });

        // Parameters for Search Box API (POIs)
        const searchParams = new URLSearchParams({
          q: searchQuery,
          access_token: accessToken,
          session_token: sessionToken.current,
          language: 'en',
          limit: '5', // Reduced from 10 to leave room for address results
          types: 'poi',
        });

        // Parameters for Geocoding API (addresses)
        const geocodingParams = new URLSearchParams({
          access_token: accessToken,
          limit: '5',
          language: 'en',
          types: 'address,place',
          autocomplete: 'true'  // Add autocomplete for better address suggestions
        });

        // Add proximity for POI searches to keep them local/relevant
        // This ensures POIs remain proximity-based
        if (mapCenter) {
          // Strong proximity bias for POIs to keep them relevant to current location
          searchParams.append('proximity', `${mapCenter.lng},${mapCenter.lat}`);
          
          // For geocoding, add proximity but with zero bias to allow global address search
          // Only affects sorting of results, not filtering
          geocodingParams.append('proximity', `${mapCenter.lng},${mapCenter.lat}`);
          geocodingParams.append('proximity_bias', '0'); // No bias for global address search
        }

        // Only add bbox for POI searches to keep them confined to visible map
        if (map.current) {
          const bounds = map.current.getBounds();
          const bbox = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
          ];
          
          // Only add bbox if values are valid numbers
          if (bbox.every(coord => !isNaN(coord) && isFinite(coord))) {
            // Apply bbox only to POI searches to keep them within map view
            searchParams.append('bbox', bbox.join(','));
            // Don't apply bbox to geocoding results to allow global address search
          }
        }

        // Add filter parameters to search
        if (filters.priceRange) {
          searchParams.append('price_range', filters.priceRange);
        }
        if (filters.rating) {
          searchParams.append('min_rating', filters.rating.toString());
        }
        if (filters.openNow) {
          searchParams.append('open_now', 'true');
        }
        if (filters.accessibility) {
          searchParams.append('accessibility', 'true');
        }

        // Encode query for geocoding URL
        const encodedQuery = encodeURIComponent(searchQuery);

        // Fetch both POIs and addresses in parallel
        const [searchResponse, geocodingResponse] = await Promise.all([
          fetch(`${searchUrl}?${searchParams}`),
          fetch(`${geocodingUrl}/${encodedQuery}.json?${geocodingParams}`)
        ]);
        
        // Process Search Box API response
        let mapboxPoiSuggestions: SuggestedFeature[] = [];
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.suggestions?.length > 0) {
            mapboxPoiSuggestions = searchData.suggestions
              .filter((suggestion: any) => suggestion.name || suggestion.place_name)
              .map((suggestion: any) => {
                // Get coordinates from all possible sources
                let coordinates = null;
                
                // Try to extract coordinates from the suggestion
                if (suggestion.coordinates) {
                  coordinates = [suggestion.coordinates.longitude, suggestion.coordinates.latitude];
                } else if (suggestion.geometry?.coordinates) {
                  coordinates = suggestion.geometry.coordinates;
                } else if (suggestion.bbox) {
                  coordinates = [
                    (suggestion.bbox[0] + suggestion.bbox[2]) / 2,
                    (suggestion.bbox[1] + suggestion.bbox[3]) / 2
                  ];
                } else if (suggestion.metadata?.coordinates) {
                  coordinates = suggestion.metadata.coordinates;
                } else if (suggestion.context?.coordinates) {
                  coordinates = [suggestion.context.coordinates.longitude, suggestion.context.coordinates.latitude];
                }

                const name = suggestion.name || suggestion.text;
                const place_name = suggestion.full_address || suggestion.place_name || name;
                const isLocationPOI = suggestion.feature_type === 'poi' && suggestion.address;

                return {
                  id: suggestion.mapbox_id || `suggestion-poi-${Date.now()}-${Math.random()}`,
                  type: suggestion.feature_type || 'poi',
                  place_type: [suggestion.feature_type || 'poi'],
                  place_name: place_name,
                  text: name,
                  center: coordinates,
                  name: name,
                  address: suggestion.address,
                  full_address: suggestion.full_address,
                  properties: {
                    category: suggestion.poi_category?.[0] || suggestion.category || suggestion.feature_type,
                    maki: suggestion.maki,
                    coordinates: coordinates,
                    feature_score: suggestion.feature_score,
                    matching_name: suggestion.matching_name,
                    matching_place_name: suggestion.matching_place_name,
                    address: suggestion.address,
                    distance: suggestion.distance,
                    isLocationPOI: isLocationPOI,
                    source: 'search'
                  }
                };
              })
              .filter(Boolean);
          }
        } else {
          console.error('Search API error:', await searchResponse.text());
        }

        // Process Geocoding API response
        let addressSuggestions: SuggestedFeature[] = [];
        if (geocodingResponse.ok) {
          const geocodingData = await geocodingResponse.json();
          if (geocodingData.features?.length > 0) {
            addressSuggestions = geocodingData.features
              .filter((feature: any) => feature.place_name)
              .map((feature: any) => {
                // Extract the house number if available
                const addressContext = feature.context?.find((c: any) => c.id.startsWith('address'));
                const houseNumber = feature.address || 
                                   (addressContext?.text.match(/^\d+/) ? addressContext.text.match(/^\d+/)[0] : '');
                
                // Format a better display address with house number if available
                const displayName = feature.text || feature.place_name.split(',')[0];
                const betterText = houseNumber && !displayName.includes(houseNumber) 
                                  ? `${houseNumber} ${displayName}` 
                                  : displayName;
                
                return {
                  id: feature.id || `suggestion-geo-${Date.now()}-${Math.random()}`,
                  type: feature.place_type?.[0] || 'address',
                  place_type: feature.place_type || ['address'],
                  place_name: feature.place_name,
                  text: betterText,
                  center: feature.center,
                  name: betterText,
                  address: houseNumber,
                  full_address: feature.place_name,
                  properties: {
                    category: feature.place_type?.[0] || 'address',
                    coordinates: feature.center,
                    address: houseNumber,
                    feature_score: 1.0, // Prioritize geocoding results
                    source: 'geocoding'
                  },
                  geometry: {
                    coordinates: feature.center,
                    type: 'Point'
                  }
                };
              });
          }
        } else {
          console.error('Geocoding API error:', await geocodingResponse.text());
        }

        // Combine all results: Database POIs first, then Mapbox POIs, then addresses
        let allSuggestions = [...poiSuggestions, ...mapboxPoiSuggestions, ...addressSuggestions];
        // If there are fuzzy POI matches, add a special clickable category at the top
        if (poiResults.length > 0) {
          allSuggestions = [
            {
              id: 'fuzzy-poi-category',
              type: 'fuzzy-poi-category',
              place_type: ['category'],
              place_name: t('search.fuzzy_category', { query }),
              text: t('search.fuzzy_category', { query }),
              name: t('search.fuzzy_category', { query }),
              properties: { category: 'fuzzy-poi-category' },
            },
            // Only include non-POI results (Mapbox POIs and addresses)
            ...mapboxPoiSuggestions,
            ...addressSuggestions
          ];
        }
        
        // Deduplicate by name and approximate location
        const uniqueSuggestions = allSuggestions.reduce((acc: SuggestedFeature[], current) => {
          const isDuplicate = acc.some(item => 
            (item.name?.toLowerCase() === current.name?.toLowerCase() && 
             item.center && current.center &&
             Math.abs(item.center[0] - current.center[0]) < 0.01 &&
             Math.abs(item.center[1] - current.center[1]) < 0.01)
          );
          
          if (!isDuplicate) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        if (uniqueSuggestions.length > 0) {
          setSearchResults(uniqueSuggestions);
          setShowResults(true);
        } else {
          // Always show the results UI even when empty
          setSearchResults([]);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        // Show empty results UI with error state
        setSearchResults([]);
        setShowResults(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleResultSelect = async (suggestion: SuggestedFeature) => {
    if (suggestion.type === 'fuzzy-poi-category') {
      // Show only the fuzzy POI matches and zoom map to fit them
      setSearchResults(fuzzyPoiMatches.map(poi => {
        const suggestion: SuggestedFeature = {
          id: poi.id,
          type: 'poi',
          place_type: poi.place_type,
          place_name: poi.place_name,
          text: poi.text,
          center: poi.center,
          name: poi.name,
          address: poi.poi_data?.address,
          full_address: poi.poi_data?.address,
                      properties: {
              ...poi.properties,
              poi_data: poi.poi_data,
              review_author: poi.review_author,
              review_text: poi.review_text,
              review_rating: poi.review_rating,
              distance: poi.distance, // Ensure distance is passed through
              isNearest: poi.properties?.isNearest, // Pass through nearest flag
            }
        };
        
        return suggestion;
      }));
      setShowingFuzzyCategory(true);
      setShowResults(true);
      // Zoom map to fit all POIs
      if (map.current && fuzzyPoiMatches.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        fuzzyPoiMatches.forEach(poi => {
          if (poi.center) bounds.extend(poi.center);
        });
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, { padding: 80, maxZoom: 16 });
        }
      }
      return;
    }
    try {
      // Set loading state
      setIsSearching(true);

      // First check if we already have precise coordinates
      if (suggestion.center && suggestion.center[0] !== 0 && suggestion.center[1] !== 0) {
        handleLocationSelect(suggestion);
        setIsSearching(false);
        return;
      }

      // Get search text to geocode - prefer full address if available
      const searchText = suggestion.full_address || 
                        suggestion.place_name || 
                        (suggestion.address && suggestion.name ? `${suggestion.address} ${suggestion.name}` : suggestion.name);
      
      // Use Mapbox Geocoding API to get precise coordinates
      const geocodingUrl = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places');
      const encodedQuery = encodeURIComponent(searchText);
      const params = new URLSearchParams({
        access_token: accessToken,
        limit: '1',
        language: 'en',
        types: 'address,place',
        autocomplete: 'false'  // Exact match for final selection
      });

      // Different handling for POIs vs addresses
      const isPOI = suggestion.properties?.source === 'search';
      
      // Add proximity bias based on type:
      // - For POIs: strong proximity bias to maintain local relevance
      // - For addresses: no proximity bias to allow global search
      if (map.current) {
        const mapCenter = map.current.getCenter();
        params.append('proximity', `${mapCenter.lng},${mapCenter.lat}`);
        
        if (isPOI) {
          // POIs should be local/relevant to current view
          // Default high proximity bias
        } else {
          // Addresses can be global
          params.append('proximity_bias', '0');  // No bias for global address search
        }
      }

      const response = await fetch(`${geocodingUrl}/${encodedQuery}.json?${params}`);
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // We got precise coordinates from geocoding
        const geocodedLocation = data.features[0];
        
        // Create an enhanced location object with precise coordinates
        const enhancedLocation = {
          ...suggestion,
          center: geocodedLocation.center,
          geometry: {
            coordinates: geocodedLocation.center,
            type: 'Point'
          },
          // Maintain original name and details but add geocoding data
          geocoded_place_name: geocodedLocation.place_name,
          geocoded_address: geocodedLocation.properties?.address
        };
        
        handleLocationSelect(enhancedLocation);
      } else {
        // Fallback to original suggestion if geocoding fails
        handleLocationSelect(suggestion);
      }

      // Generate new session token after each search
      sessionToken.current = uuidv4();
      setIsSearching(false);
    } catch (error) {
      console.error('Selection error:', error);
      
      // Fallback to original suggestion
      handleLocationSelect(suggestion);
      
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location: any) => {
    clearSearchMarkers();
    
    let locationCoordinates: [number, number] | null = null;

    // Get coordinates from all possible sources
    if (location.center && Array.isArray(location.center) && location.center.length === 2) {
      locationCoordinates = location.center;
    } else if (location.geometry?.coordinates) {
      locationCoordinates = location.geometry.coordinates;
    } else if (location.coordinates) {
      locationCoordinates = [location.coordinates.longitude, location.coordinates.latitude];
    } else if (location.full_address || location.address || location.properties?.address) {
      const hasAddressData = location.full_address || location.address || location.properties?.address;
      
      // Validate coordinates - check if they're valid numbers and not [0,0]
      const isValidCoordinates = locationCoordinates && 
        locationCoordinates.length === 2 && 
        !isNaN(locationCoordinates[0]) && 
        !isNaN(locationCoordinates[1]) && 
        !(locationCoordinates[0] === 0 && locationCoordinates[1] === 0);

      // Only use map center if we have NO valid coordinates AND we have address data
      if (!isValidCoordinates && hasAddressData && map.current) {
        const mapCenter = map.current.getCenter();
        locationCoordinates = [mapCenter.lng, mapCenter.lat];
      } else if (!isValidCoordinates && !hasAddressData) {
        console.error('No valid coordinates found and no address data available:', location);
        return;
      }
    }

    // If we still have no coordinates, we can't proceed
    if (!locationCoordinates) {
      console.error('No coordinates available for location:', location);
      return;
    }

    // Determine appropriate zoom level based on location type
    let zoomLevel = 15; // Default zoom level
    
    if (location.properties?.source === 'geocoding') {
      // For address results, zoom in more
      if (location.place_type?.includes('address')) {
        zoomLevel = 17; // Closer zoom for specific addresses
      } else if (location.place_type?.includes('place')) {
        zoomLevel = 13; // Wider zoom for cities/places
      } else if (location.place_type?.includes('country')) {
        zoomLevel = 5; // Very wide zoom for countries
      } else if (location.place_type?.includes('region')) {
        zoomLevel = 8; // Wide zoom for regions/states
      }
    } else {
      // For POI results
      if (location.properties?.category === 'restaurant' || 
          location.properties?.category === 'cafe' ||
          location.properties?.category === 'bar') {
        zoomLevel = 17; // Closer zoom for restaurants/cafes
      } else if (location.properties?.category === 'hotel') {
        zoomLevel = 16; // Good zoom for hotels
      } else if (location.properties?.category === 'landmark' || 
                location.properties?.category === 'museum' ||
                location.properties?.category === 'attractions') {
        zoomLevel = 16; // Good zoom for attractions
      }
    }

    if (onLocationSelect) {
      onLocationSelect({...location, center: locationCoordinates, zoom: zoomLevel});
    } else if (map.current && locationCoordinates) {
      map.current.flyTo({
        center: locationCoordinates,
        zoom: zoomLevel,
        duration: 1500
      });



      // Create marker element with category-specific styling (matching MapDashboard)
      const markerEl = document.createElement('div');
      markerEl.className = 'category-marker';
      markerEl.style.width = '40px';
      markerEl.style.height = '40px';
      markerEl.style.display = 'flex';
      markerEl.style.alignItems = 'center';
      markerEl.style.justifyContent = 'center';
      markerEl.style.cursor = 'pointer';
      markerEl.style.transition = 'box-shadow 0.2s ease';
      markerEl.style.zIndex = '1';
      markerEl.style.position = 'relative';
      markerEl.style.transform = 'none';

      // Get category styling
      const categoryColor = getCategoryColor(location.properties?.category, location.place_type);
      const categoryEmoji = getCategoryEmoji(location.properties?.category, location.place_type);

      // Create the main icon container (matching MapDashboard style)
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
      markerEl.appendChild(iconContainer);

      // Add hover effect (matching MapDashboard)
      markerEl.onmouseover = () => {
        markerEl.style.zIndex = '10';
        iconContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      };
      markerEl.onmouseout = () => {
        markerEl.style.zIndex = '1';
        iconContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      };

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat(locationCoordinates)
        .addTo(map.current);

      // Create details card
      const detailsCard = document.createElement('div');
      detailsCard.className = 'location-details-card';
      detailsCard.style.display = 'none';
      detailsCard.style.position = 'absolute';
      detailsCard.style.bottom = '0';
      detailsCard.style.left = '0';
      detailsCard.style.right = '0';
      detailsCard.style.backgroundColor = 'white';
      detailsCard.style.borderTopLeftRadius = '1rem';
      detailsCard.style.borderTopRightRadius = '1rem';
      detailsCard.style.padding = '1rem';
      detailsCard.style.boxShadow = '0 -4px 6px -1px rgba(0, 0, 0, 0.1)';
      detailsCard.style.zIndex = '1000';
      detailsCard.style.transform = 'translateY(100%)';
      detailsCard.style.transition = 'transform 0.3s ease-in-out';

      // Add content to details card
      detailsCard.innerHTML = `
                    <div class="flex items-start justify-between mb-4">
              <div class="flex items-center">
                <div class="mr-3">
                  <div style="width: 32px; height: 32px; background: ${categoryColor}; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                    ${categoryEmoji}
                  </div>
                </div>
            <div>
              <h3 class="font-semibold text-lg">${location.text || location.name || ''}</h3>
              <p class="text-sm text-gray-500">${location.place_name || location.address || ''}</p>
            </div>
          </div>
          <button class="close-details p-2 hover:bg-gray-100 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="space-y-3">
          ${location.properties?.distance ? `
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ${formatDistance(location.properties.distance)}
            </div>
          ` : ''}
          <div className="flex space-x-2">
            <button class="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>${t('search.directions')}</span>
            </button>
            <button class="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      `;

      // Add details card to the map container
      map.current.getContainer().appendChild(detailsCard);

      // Function to show details card
      const showDetails = () => {
        detailsCard.style.display = 'block';
        requestAnimationFrame(() => {
          detailsCard.style.transform = 'translateY(0)';
        });
      };

      // Function to hide details card
      const hideDetails = () => {
        detailsCard.style.transform = 'translateY(100%)';
        setTimeout(() => {
          detailsCard.style.display = 'none';
        }, 300);
      };

      // Add click event listener to marker element
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetails();
      });

      // Add touch event listener for mobile
      markerEl.addEventListener('touchend', (e) => {
        e.stopPropagation();
        showDetails();
      });

      // Close details card when close button is clicked
      detailsCard.querySelector('.close-details')?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideDetails();
      });

      // Close details card when clicking outside
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        if (!detailsCard.contains(e.target as Node) && !markerEl.contains(e.target as Node)) {
          hideDetails();
        }
      };

      // Add both click and touch event listeners for outside clicks
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('touchend', handleOutsideClick);

      // Clean up event listeners when marker is removed
      const cleanup = () => {
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('touchend', handleOutsideClick);
        detailsCard.remove();
      };

      // Store cleanup function in marker for later use
      (marker as any).cleanup = cleanup;

      searchMarkersRef.current = [marker];
    }

    // Save to recent searches with guaranteed unique ID
    const searchResult: SearchResult = {
      id: location.id || `place-${Date.now()}-${locationCoordinates.join('-')}`,
      place_name: location.place_name || location.name || '',
      center: locationCoordinates,
      place_type: Array.isArray(location.place_type) ? location.place_type : [location.type || 'place'],
      properties: {
        category: location.properties?.category || location.type,
        maki: location.properties?.maki
      },
      text: location.text || location.name || ''
    };

    const updatedSearches = [
      searchResult,
      ...recentSearches.filter(s => s.id !== searchResult.id)
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentMapSearches', JSON.stringify(updatedSearches));

    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setIsSearchFocused(false);
  };

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: EnhancedSearchResult[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('mapFavorites', JSON.stringify(newFavorites));
  };

  // Toggle favorite status
  const toggleFavorite = (result: EnhancedSearchResult) => {
    const isFavorite = favorites.some(fav => fav.id === result.id);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav.id !== result.id);
    } else {
      newFavorites = [...favorites, result];
    }
    
    saveFavorites(newFavorites);
    if (onSaveToFavorites) {
      onSaveToFavorites(result);
    }
  };

  // Share location
  const shareLocation = async (result: EnhancedSearchResult) => {
    const shareData = {
      title: result.text,
      text: result.place_name,
      url: `https://www.google.com/maps/search/?api=1&query=${result.center[1]},${result.center[0]}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareData.url);
        alert('Location URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  // Add direction handling function
  const handleGetDirections = (result: EnhancedSearchResult) => {
    // Get the best available address for navigation
    const destinationAddress = result.full_address || 
                              result.place_name || 
                              (result.address && result.name ? `${result.address} ${result.name}` : result.name) ||
                              result.text;
    
    if (!destinationAddress) {
      console.error('No address information available for directions', result);
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

  // Enhanced ResultCard component with new features
  const ResultCard = ({ result }: { result: EnhancedSearchResult }) => {
    const isFavorite = favorites.some(fav => fav.id === result.id);
    const isPOI = result.properties?.source === 'database_poi';
    const poiData = result.poi_data;
    


    return (
      <div className={cn("p-4 border-b border-gray-100 hover:bg-gray-50 relative", result.properties?.isNearest && "ring-2 ring-green-500/60 bg-green-50")}> 
        {result.properties?.isNearest && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
            {t('search.nearest', 'Nearest')}
          </div>
        )}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {result.photos?.[0] ? (
              <img 
                src={result.photos[0]} 
                alt={result.text}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : isPOI && poiData?.category_image_url ? (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                <img 
                  src={poiData.category_image_url} 
                  alt={poiData.category_name || 'POI'}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              </div>
            ) : (
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white shadow-md"
                style={{ 
                  backgroundColor: getCategoryColor(result.properties?.category, result.place_type),
                  fontSize: '20px'
                }}
              >
                {getCategoryEmoji(result.properties?.category, result.place_type)}
              </div>
            )}
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{result.text}</h3>
              <div className="flex items-center space-x-2">
                {(isPOI && poiData?.average_rating && poiData.average_rating > 0) || (result.rating && result.rating > 0) ? (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">
                      {isPOI && poiData?.average_rating && poiData.average_rating > 0
                        ? (poiData.rating_type === 'out_of_5' 
                            ? `${poiData.average_rating.toFixed(1)}/5`
                            : poiData.rating_type === 'percentage'
                            ? `${poiData.average_rating.toFixed(0)}%`
                            : `${poiData.average_rating.toFixed(1)}/10`)
                        : result.rating && result.rating > 0
                        ? result.rating.toFixed(1)
                        : ''
                      }
                    </span>
                  </div>
                ) : null}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(result);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <Heart 
                    className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                  />
                </div>
              </div>
            </div>
            
            {/* Only show place_name if it's different from the main title and not empty */}
            {result.place_name && result.place_name !== result.text && result.place_name.trim() && (
              <p className="text-sm text-gray-500">{result.place_name}</p>
            )}
            
            {isPOI && poiData?.category_name && (
              <div className="mt-1 text-sm text-gray-600">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {poiData.category_name}
                </span>
              </div>
            )}
            
            {/* Show review information if available */}
            {isPOI && result.review_text && result.review_text.trim() && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {result.review_author ? `${t('search.review_by', "Review by")} ${result.review_author}` : t('search.review', "Review")}
                  </span>
                  {result.review_rating && result.review_rating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="ml-1 text-xs text-gray-600">
                        {typeof result.review_rating === 'number' ? result.review_rating.toFixed(1) : result.review_rating}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  "{result.review_text}"
                </p>
              </div>
            )}
            
            {isPOI && poiData?.description && poiData.description.trim() && poiData.description !== '0' && !result.review_text && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {poiData.description}
              </p>
            )}
            
            {result.priceLevel && result.priceLevel > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                {'$'.repeat(result.priceLevel)}
              </div>
            )}
            {result.openingHours && (
              <div className="mt-1 text-sm text-gray-600">
                {result.openingHours.open ? (
                  <span className="text-green-600">{t('search.open_now')}</span>
                ) : (
                  <span className="text-red-600">{t('search.closed')}</span>
                )}
              </div>
            )}
            {(result.distance || result.properties?.distance) && (result.distance || result.properties?.distance) > 0 && (
              <div className="mt-1 text-sm text-gray-500">
                {formatDistance(result.distance || result.properties?.distance)}
              </div>
            )}
            <div className="mt-2 flex items-center space-x-2">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleGetDirections(result);
                }}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Navigation className="w-4 h-4 mr-1" />
                {t('search.directions')}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  shareLocation(result);
                }}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter panel component
  const FilterPanel = () => (
    <div className="p-4 border-t border-gray-100">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Price Range</label>
          <select
            value={filters.priceRange || ''}
            onChange={(e) => handleFilterChange('priceRange', e.target.value || undefined)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Any</option>
            <option value="low">$</option>
            <option value="medium">$$</option>
            <option value="high">$$$</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Minimum Rating</label>
          <select
            value={filters.rating || ''}
            onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Any</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="openNow"
            checked={filters.openNow || false}
            onChange={(e) => handleFilterChange('openNow', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="openNow" className="ml-2 block text-sm text-gray-700">
            Open now
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="accessibility"
            checked={filters.accessibility || false}
            onChange={(e) => handleFilterChange('accessibility', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="accessibility" className="ml-2 block text-sm text-gray-700">
            Wheelchair accessible
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "absolute z-20 transition-all duration-300 ease-in-out",
      isSearchFocused
        ? "w-full max-w-xl mx-auto left-0 right-0 top-4 px-4"
        : "w-[calc(100%-32px)] max-w-md mx-auto left-0 right-0 top-4"
    )}>
      <div className="relative" ref={searchContainerRef}>
        <div className={cn(
          "relative bg-white rounded-xl shadow-lg overflow-hidden",
          isSearchFocused ? "shadow-xl" : "hover:shadow-xl transition-shadow"
        )}>
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className={cn(
                "w-full px-4 pl-12 pr-10 py-3 border-none",
                "bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-gray-900 placeholder:text-gray-400"
              )}
              autoComplete="off"
              spellCheck="false"
              placeholder={t('search.placeholder', "Search locations...")}
              inputMode="text"
              enterKeyHint="search"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                  clearSearchMarkers();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
        </div>

        {isSearchFocused && (
            <div className="search-container border-t border-gray-100">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                </button>
                {Object.keys(filters).length > 0 && (
                  <button
                    onClick={() => setFilters({})}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {showFilters && <FilterPanel />}

              {showResults ? (
                <div className="max-h-[60vh] overflow-y-auto">
                  {/* Show fuzzy category button if there are fuzzy matches and not already showing */}
                  {fuzzyPoiMatches.length > 0 && !showingFuzzyCategory && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
                      <button
                        key="fuzzy-poi-category-btn"
                        onClick={() => handleResultSelect({
                          id: 'fuzzy-poi-category',
                          type: 'fuzzy-poi-category',
                          place_type: ['category'],
                          place_name: t('search.fuzzy_category', { query: searchQuery }),
                          text: t('search.fuzzy_category', { query: searchQuery }),
                          name: t('search.fuzzy_category', { query: searchQuery }),
                          properties: { category: 'fuzzy-poi-category' },
                        })}
                        className="w-full text-left bg-white hover:bg-blue-50 border border-blue-200 rounded-lg p-4 font-semibold text-blue-900 transition-colors duration-200 shadow-sm"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-blue-900 text-lg">
                              {t('search.fuzzy_category', { query: searchQuery })}
                            </div>
                            <div className="text-sm text-blue-700 mt-1">
                              {t('search.fuzzy_category_description', "See the best reviews and recommended places and activities by ZapAround")}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">→</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <button
                        key={`search-result-${result.id}`}
                        onClick={() => handleResultSelect(result)}
                        className="w-full text-left"
                      >
                        <ResultCard result={{
                          ...result,
                          review_author: result.properties?.review_author,
                          review_text: result.properties?.review_text,
                          review_rating: result.properties?.review_rating,
                          poi_data: result.properties?.poi_data,
                          distance: result.properties?.distance,
                        } as EnhancedSearchResult} />
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        {t('search.no_results', "No {{category}} found", {
                          category: Object.keys(categoryQueries).find(key => 
                            categoryQueries[key].toLowerCase() === searchQuery.toLowerCase() ||
                            searchQuery.toLowerCase().includes(key.toLowerCase())
                          ) || searchQuery
                        })}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {t('search.try_again', "Try zooming out or changing your search")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex space-x-2 mb-4">
                    <button
                      key="categories-tab"
                      onClick={() => setActiveTab('categories')}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm font-medium rounded-md",
                        activeTab === 'categories'
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-200"
                      )}
                    >
                      {t('search.tabs.categories', "Categories")}
                    </button>
                    <button
                      key="favorites-tab"
                      onClick={() => setActiveTab('favorites')}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm font-medium rounded-md",
                        activeTab === 'favorites'
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-200"
                      )}
                    >
                      {t('search.tabs.recent', "Recent")}
                    </button>
                    </div>

                  {activeTab === 'categories' ? (
                    <div key="categories-content">
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {categoryButtons.map((btn) => (
                          <button
                            key={`category-button-${btn.id}`}
                            onClick={() => {
                              setSearchQuery(btn.query);
                              handleSearch(btn.query);
                              setIsSearchFocused(true);
                            }}
                            className="flex flex-col items-center p-2 bg-white border 
                              border-gray-200 rounded-md hover:bg-gray-50"
                          >
                            {btn.icon}
                            <span className="text-xs mt-1">{btn.label}</span>
                  </button>
                ))}
              </div>
                      <div className="space-y-1">
                        {categoryList.map((cat) => (
                  <button
                            key={`category-list-${cat.id}`}
                    onClick={() => {
                              setSearchQuery(cat.query);
                              handleSearch(cat.query);
                              setIsSearchFocused(true);
                    }}
                            className="w-full flex items-center p-2 rounded-md hover:bg-gray-50"
                  >
                            {cat.icon}
                            <span className="ml-3 text-sm">{cat.label}</span>
                  </button>
                        ))}
                </div>
                    </div>
                  ) : (
                    <div key="favorites-content" className="space-y-1">
                      {favorites.length > 0 ? (
                        favorites.map((item) => (
                          <button
                            key={`favorite-${item.id}`}
                            onClick={() => handleLocationSelect(item)}
                            className="w-full flex items-center p-2 rounded-md hover:bg-gray-50"
                          >
                            {getCategoryIcon(item.properties?.category, item.place_type)}
                            <div className="ml-3 text-left">
                              <div className="font-medium">{item.text}</div>
                              <div className="text-sm text-gray-500">
                                {item.place_name.split(',').slice(1).join(',').trim()}
                    </div>
                    </div>
                  </button>
                        ))
                      ) : (
                        <div key="no-favorites" className="text-center py-4 text-gray-500">
                          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>{t('search.no_favorites', "No favorites added")}</p>
              </div>
            )}
                    </div>
                  )}
                </div>
              )}
              </div>
            )}
              </div>
      </div>
    </div>
  );
}; 