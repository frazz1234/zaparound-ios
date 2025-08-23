import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPinIcon, Crosshair, Search, Loader2, Globe, Building2, Landmark, Home } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { geolocationService } from "@/services/geolocationService";
import { motion, AnimatePresence } from "framer-motion";

interface LocationSuggestion {
  place_name: string;
  center: [number, number];
  isCity?: boolean;
  isExactAddress?: boolean;
  isCountry?: boolean;
  isRegion?: boolean;
  type: string;
}

interface LocationSearchProps {
  value: string;
  onChange: (location: string, coordinates: [number, number]) => void;
  onSelect?: (location: string, coordinates: [number, number]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ value, onChange, onSelect, disabled, className, placeholder }) => {
  const { t } = useTranslation('common');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelecting = useRef(false);
  const debounceTimeout = useRef<number | null>(null);
  const [exactAddress, setExactAddress] = useState<LocationSuggestion | null>(null);

  useEffect(() => {
    const searchLocation = async () => {
      if (isSelecting.current || !showSuggestions || value.length < 2) {
        isSelecting.current = false;
        setLocationSuggestions([]);
        return;
      }

      if (value === selectedValue) {
        setShowSuggestions(false);
        return;
      }

      try {
        setIsSearching(true);
        // Add cache buster to prevent cached responses
        const cacheBuster = new Date().getTime();
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place,address,poi,neighborhood,locality,postcode,country,region&limit=15&cacheBuster=${cacheBuster}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        const suggestions = data.features.map((feature: any) => ({
          place_name: feature.place_name,
          center: feature.center,
          isExactAddress: feature.place_type?.includes('address'),
          isCity: feature.place_type?.includes('place'),
          isCountry: feature.place_type?.includes('country'),
          isRegion: feature.place_type?.includes('region'),
          type: feature.place_type?.[0] || 'unknown'
        }));

        // Sort suggestions to prioritize exact addresses, cities, regions, and countries
        const sortedSuggestions = suggestions.sort((a: LocationSuggestion, b: LocationSuggestion) => {
          if (a.isExactAddress && !b.isExactAddress) return -1;
          if (!a.isExactAddress && b.isExactAddress) return 1;
          if (a.isCity && !b.isCity) return -1;
          if (!a.isCity && b.isCity) return 1;
          if (a.isRegion && !b.isRegion) return -1;
          if (!a.isRegion && b.isRegion) return 1;
          if (a.isCountry && !b.isCountry) return -1;
          if (!a.isCountry && b.isCountry) return 1;
          return 0;
        });
        
        setLocationSuggestions(sortedSuggestions);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a shorter debounce timeout (200ms instead of 300ms)
    debounceTimeout.current = window.setTimeout(searchLocation, 200);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [value, selectedValue, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    isSelecting.current = true;
    setSelectedValue(suggestion.place_name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    onChange(suggestion.place_name, suggestion.center);
    onSelect?.(suggestion.place_name, suggestion.center);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, [0, 0]);
    if (newValue !== selectedValue) {
      setSelectedValue("");
      if (newValue.length >= 2) {
        setShowSuggestions(true);
      }
    }
  };

  const handleInputFocus = () => {
    if (!disabled && value.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelect = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place`
      );
      const data = await response.json();
      if (data.features && data.features[0]) {
        const [lng, lat] = data.features[0].center;
        const locationName = data.features[0].place_name;
        onChange(locationName, [lng, lat]);
        onSelect?.(locationName, [lng, lat]);
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  const handleGetCurrentLocation = async () => {
    if (disabled) return;
    
    setIsGettingLocation(true);
    
    try {
      const position = await geolocationService.getCurrentPosition();
      
      // First get the city-level location
      const cityResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.longitude},${position.latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=place`
      );
      const cityData = await cityResponse.json();
      
      // Then get the exact address
      const addressResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.longitude},${position.latitude}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=address`
      );
      const addressData = await addressResponse.json();

      if (cityData.features && cityData.features[0] && addressData.features && addressData.features[0]) {
        const cityName = cityData.features[0].place_name;
        const exactAddress = addressData.features[0].place_name;
        
        // Show only city in suggestions
        setLocationSuggestions([
          {
            place_name: cityName,
            center: [position.longitude, position.latitude],
            isCity: true,
            type: 'place'
          }
        ]);
        setShowSuggestions(true);
        setSelectedValue(cityName);
        onChange(cityName, [position.longitude, position.latitude]);

        // Store exact address for the question section
        setExactAddress({
          place_name: exactAddress,
          center: [position.longitude, position.latitude],
          type: 'address'
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleUseExactAddress = () => {
    if (exactAddress) {
      handleLocationSelect(exactAddress);
      setExactAddress(null);
    }
  };

  const handleFocusSearch = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div 
        className={cn(
          "relative flex items-center transition-all group",
          "rounded-lg shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#61936f]/40",
          disabled ? "opacity-60" : ""
        )}
      >
        <div className="absolute left-3 text-gray-400 group-focus-within:text-[#61936f]">
          <Search className="h-5 w-5" />
        </div>
        
        <Input
          ref={inputRef}
          id="location"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('form.destinationPlaceholder')}
          className={cn(
            "pl-10 pr-10 h-12 rounded-lg border-[#e2e2e2]",
            "text-[15px] placeholder:text-gray-400",
            "focus:border-[#61936f] focus-visible:ring-0 focus-visible:border-[#61936f]",
            "transition-all rounded-r-none",
            className
          )}
          required
          disabled={disabled}
          inputMode="text"
          type="search"
          enterKeyHint="search"
        />
        
        <div className="absolute right-[3.25rem] flex items-center">
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-[#61936f]" />
          )}
        </div>
        
        <Button 
          type="button"
          variant="outline" 
          size="icon" 
          onClick={handleGetCurrentLocation}
          disabled={disabled || isGettingLocation}
          className={cn(
            "h-12 min-w-12 rounded-l-none border-l-0 border-[#e2e2e2]",
            "hover:bg-[#61936f]/10 hover:text-[#61936f] hover:border-[#61936f]",
            "focus:border-[#61936f] focus:text-[#61936f]",
            isGettingLocation && "text-[#61936f]"
          )}
          aria-label={t('common.useCurrentLocation') || "Use current location"}
          title={t('common.useCurrentLocation') || "Use current location"}
        >
          {isGettingLocation ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Crosshair className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Exact Address Question */}
      {exactAddress && (
        <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-1.5">
            <MapPinIcon className="h-3.5 w-3.5 text-[#61936f] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-600">
                {t('useExactAddress')}
              </div>
              <div className="mt-0.5 text-xs font-medium text-gray-900">
                {exactAddress.place_name}
              </div>
              <button
                onClick={handleUseExactAddress}
                className="mt-1 text-xs text-[#61936f] hover:text-[#4a7a5a] font-medium"
              >
                {t('exactAddress')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {showSuggestions && locationSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 overflow-y-auto",
              "backdrop-blur-sm",
              "w-full",
              "mt-1"
            )}
            style={{ 
              maxHeight: "300px"
            }}
          >
            {locationSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, delay: index * 0.03 }}
                type="button"
                className={cn(
                  "w-full text-left px-4 py-3 text-sm flex items-center gap-2",
                  "hover:bg-gray-50 focus:outline-none focus:bg-gray-50",
                  "transition-colors",
                  "touch-action-manipulation",
                  "active:bg-gray-100",
                  "min-h-[48px]"
                )}
                onClick={() => handleLocationSelect(suggestion)}
              >
                {suggestion.isCountry ? (
                  <Globe className="h-4 w-4 flex-shrink-0 text-blue-600" />
                ) : suggestion.isRegion ? (
                  <Landmark className="h-4 w-4 flex-shrink-0 text-purple-600" />
                ) : suggestion.isCity ? (
                  <Building2 className="h-4 w-4 flex-shrink-0 text-[#61936f]" />
                ) : suggestion.isExactAddress ? (
                  <Home className="h-4 w-4 flex-shrink-0 text-orange-600" />
                ) : (
                  <MapPinIcon className="h-4 w-4 flex-shrink-0 text-gray-600" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {suggestion.place_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {suggestion.isExactAddress && t('exactAddress')}
                    {suggestion.isCountry && t('country')}
                    {suggestion.isRegion && t('region')}
                    {suggestion.isCity && t('city')}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
