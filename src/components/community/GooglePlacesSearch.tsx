import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, X, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
  };
}

interface GooglePlacesSearchProps {
  value: string;
  onChange: (location: string, placeDetails?: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export const GooglePlacesSearch: React.FC<GooglePlacesSearchProps> = ({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  currentLocation
}) => {
  const { t, i18n } = useTranslation('community');
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(currentLocation || null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Update user location when currentLocation prop changes
  useEffect(() => {
    if (currentLocation) {
      setUserLocation(currentLocation);
    }
  }, [currentLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      return null;
    }

    setIsGettingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Faster, less battery usage
          timeout: 5000, // Shorter timeout
          maximumAge: 300000 // Accept location up to 5 minutes old
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setUserLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: 'Location Error',
        description: 'Unable to get your current location. Please check your location permissions.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGettingLocation(false);
    }
  };

  const searchNearbyPlaces = async () => {
    const location = await getCurrentLocation();
    if (!location) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places-search', {
        body: {
          action: 'search',
          query: 'nearby places',
          location: location,
          radius: 5000, // 5km radius
          types: 'point_of_interest,tourist_attraction,restaurant,store,lodging',
          language: i18n.language
        }
      });

      if (error) {
        console.error('Error searching nearby places:', error);
        toast({
          title: 'Search Error',
          description: 'Unable to find nearby places.',
          variant: 'destructive',
        });
        return;
      }

      if (data.status === 'OK' && data.results) {
        // Convert search results to suggestion format
        const nearbySuggestions: PlaceSuggestion[] = data.results.slice(0, 8).map((place: any) => ({
          place_id: place.place_id,
          description: place.name,
          structured_formatting: {
            main_text: place.name,
            secondary_text: place.formatted_address || place.vicinity || ''
          },
          types: place.types || []
        }));

        setSuggestions(nearbySuggestions);
        setShowSuggestions(true);
        

      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        toast({
          title: 'No Places Found',
          description: 'No places found near your current location.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching nearby places:', error);
      toast({
        title: 'Search Error',
        description: 'Unable to search for nearby places.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places-search', {
        body: {
          action: 'autocomplete',
          query: query.trim(),
          location: userLocation,
          radius: 50000, // 50km radius
          language: i18n.language
        }
      });

      if (error) {
        console.error('Error searching places:', error);
        return;
      }

      if (data.status === 'OK' && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, i18n.language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: PlaceSuggestion) => {
    setIsLoading(true);
    try {
      // Get place details
      const { data, error } = await supabase.functions.invoke('google-places-search', {
        body: {
          action: 'details',
          placeId: suggestion.place_id,
          fields: 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,opening_hours',
          language: i18n.language
        }
      });

      if (error) {
        console.error('Error getting place details:', error);
        return;
      }

      if (data.status === 'OK' && data.result) {
        const placeDetails = data.result as PlaceDetails;
        setSelectedPlace(placeDetails);
        setInputValue(placeDetails.name);
        onChange(placeDetails.name, placeDetails);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedPlace(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange('');
  };

  const getPlaceIcon = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('food')) {
      return '🍽️';
    } else if (types.includes('tourist_attraction') || types.includes('point_of_interest')) {
      return '🏛️';
    } else if (types.includes('lodging') || types.includes('hotel')) {
      return '🏨';
    } else if (types.includes('shopping_mall') || types.includes('store')) {
      return '🛍️';
    } else if (types.includes('park') || types.includes('natural_feature')) {
      return '🌳';
    } else if (types.includes('museum')) {
      return '🏛️';
    } else if (types.includes('amusement_park') || types.includes('entertainment')) {
      return '🎡';
    } else {
      return '📍';
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-[#62626a]" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || t('searchLocation')}
          disabled={disabled}
          className="pl-10 pr-20"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {/* Location Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={searchNearbyPlaces}
            disabled={isGettingLocation || disabled}
            className="h-8 w-8 p-0 text-[#62626a] hover:text-[#030303] hover:bg-gray-100"
            title="Find nearby places"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
          
          {/* Clear/Search Button */}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#62626a]" />
          ) : inputValue ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 text-[#62626a] hover:text-[#030303]"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Search className="h-4 w-4 text-[#62626a]" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-60"
          style={{ 
            maxHeight: '240px',
            minHeight: '48px'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors',
                'active:bg-gray-100 touch-manipulation min-h-[48px]', // Mobile touch improvements
                index === 0 ? 'rounded-t-lg' : '',
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              )}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg flex-shrink-0">
                  {getPlaceIcon(suggestion.types)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#030303] break-words">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-[#62626a] break-words">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Place Details */}
      {selectedPlace && (
        <div className="mt-2 p-3 bg-[#fcfcfc] border border-[#62626a]/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-lg">{getPlaceIcon(selectedPlace.types)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#030303]">{selectedPlace.name}</div>
              <div className="text-sm text-[#62626a]">{selectedPlace.formatted_address}</div>
              {selectedPlace.rating && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-[#62626a] ml-1">
                      {selectedPlace.rating.toFixed(1)}
                    </span>
                  </div>
                  {selectedPlace.user_ratings_total && (
                    <span className="text-xs text-[#62626a]">
                      ({selectedPlace.user_ratings_total} reviews)
                    </span>
                  )}
                </div>
              )}
              {selectedPlace.opening_hours && (
                <div className="mt-1">
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    selectedPlace.opening_hours.open_now
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}>
                    {selectedPlace.opening_hours.open_now ? t('openNow') : t('closed')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 