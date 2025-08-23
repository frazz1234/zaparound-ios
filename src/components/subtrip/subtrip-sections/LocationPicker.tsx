import React, { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { ChevronLeft, Globe, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { LocationDetails } from '../subtrip-types';
import { countryCurrencyMap } from '../subtrip-utils/helpers';

interface LocationPickerProps {
  location: string;
  isLoadingImage: boolean;
  locationImage: string | null;
  locationDetails: LocationDetails | null;
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  onLocationSelect: (location: string, coordinates: [number, number]) => void;
  onBack: () => void;
  onContinue: () => void;
  onCurrencyChange?: (currencyCode: string) => void;
}

const LocationPicker = forwardRef<HTMLDivElement, LocationPickerProps>(({
  location,
  isLoadingImage,
  locationImage,
  locationDetails,
  onLocationChange,
  onLocationSelect,
  onBack,
  onContinue,
  onCurrencyChange
}, ref) => {
  const { t } = useTranslation('home');
  const lastCoordinatesRef = useRef<[number, number] | null>(null);

  // Handle location selection that includes getting the country and updating currency
  const handleLocationSelect = (newLocation: string, coordinates: [number, number]) => {
    // Call the original onLocationSelect
    onLocationSelect(newLocation, coordinates);
    
    // Store the coordinates for currency update
    lastCoordinatesRef.current = coordinates;
    
    // Update currency based on location
    if (coordinates && coordinates[0] !== 0 && coordinates[1] !== 0 && onCurrencyChange) {
      // Get country from coordinates using reverse geocoding
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[1]},${coordinates[0]}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=country`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.features && data.features[0]) {
            const countryCode = data.features[0].properties.short_code?.toUpperCase();
            
            if (countryCode && countryCurrencyMap[countryCode]) {
              onCurrencyChange(countryCurrencyMap[countryCode].code);
            }
          }
        })
        .catch((error) => {
          console.error('Error getting country currency:', error);
        });
    }
  };

  return (
    <motion.div
      ref={ref}
      key="location-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full max-w-4xl mx-auto"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <div className="text-center mb-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-2 p-2 rounded-full bg-[#61936f]/10"
        >
          <Globe className="h-5 w-5 text-[#61936f]" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
        >
          {t('location.title')}
        </motion.h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-white shadow-lg overflow-visible border-0 rounded-xl relative">
          <div className="p-4 relative z-30">
            <LocationSearch
              value={location}
              onChange={onLocationChange}
              onSelect={handleLocationSelect}
              className="w-full"
            />
          </div>
        </Card>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex flex-col md:flex-row gap-3 justify-center"
        >
          <Button
            variant="outline"
            className="text-[#62626a] hover:text-[#61936f] hover:bg-[#61936f]/10 border-[#e2e2e2]"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('Back')}
          </Button>

          {location && (
            <Button
              className="bg-[#61936f] hover:bg-[#4a7256] text-white shadow-md hover:shadow-lg transition-all"
              onClick={onContinue}
              disabled={!location}
            >
              {t('continue') || "Continue"}
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
});

LocationPicker.displayName = 'LocationPicker';

export default LocationPicker; 