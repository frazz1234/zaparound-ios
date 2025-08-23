import React, { forwardRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Crosshair, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { LocationCoordinates } from '../subtrip-types';
import { countryCurrencyMap } from '../subtrip-utils/helpers';

interface RoadTripLocationsProps {
  startLocation: string;
  startCoordinates: [number, number];
  intermediateLocations: LocationCoordinates[];
  endLocation: string;
  endCoordinates: [number, number];
  isStartLocating: boolean;
  isEndLocating: boolean;
  onStartLocationChange: (location: string, coordinates: [number, number]) => void;
  onEndLocationChange: (location: string, coordinates: [number, number]) => void;
  onAddIntermediateLocation: (location: string, coordinates: [number, number]) => void;
  onRemoveIntermediateLocation: (index: number) => void;
  onStartLocateMe: () => void;
  onEndLocateMe: () => void;
  onCurrencyChange?: (currencyCode: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const RoadTripLocations = forwardRef<HTMLDivElement, RoadTripLocationsProps>(({
  startLocation,
  startCoordinates,
  intermediateLocations,
  endLocation,
  endCoordinates,
  isStartLocating,
  isEndLocating,
  onStartLocationChange,
  onEndLocationChange,
  onAddIntermediateLocation,
  onRemoveIntermediateLocation,
  onStartLocateMe,
  onEndLocateMe,
  onCurrencyChange,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newCoordinates, setNewCoordinates] = useState<[number, number]>([0, 0]);
  
  const isValid = startLocation && endLocation;

  useEffect(() => {
    if (startCoordinates && startCoordinates[0] !== 0 && startCoordinates[1] !== 0 && onCurrencyChange) {
      updateCurrencyFromCoordinates(startCoordinates);
    }
  }, [startCoordinates]);

  const updateCurrencyFromCoordinates = (coordinates: [number, number]) => {
    if (!onCurrencyChange) return;
    
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
  };

  const handleStartLocationChange = (location: string, coordinates: [number, number]) => {
    onStartLocationChange(location, coordinates);
    if (coordinates[0] !== 0 && coordinates[1] !== 0 && onCurrencyChange) {
      updateCurrencyFromCoordinates(coordinates);
    }
  };

  const handleEndLocationChange = (location: string, coordinates: [number, number]) => {
    onEndLocationChange(location, coordinates);
  };

  const handleAddIntermediateLocation = () => {
    if (newLocation && newCoordinates[0] !== 0 && newCoordinates[1] !== 0) {
      onAddIntermediateLocation(newLocation, newCoordinates);
      setNewLocation('');
      setNewCoordinates([0, 0]);
    }
  };

  return (
    <motion.div
      ref={ref}
      key="road-trip-locations-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('roadTrip.locations.title')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('roadTrip.locations.description')}
      </p>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-8">
            {/* Start Location */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('roadTrip.locations.start')}</h2>
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSearch
                    value={startLocation}
                    onChange={(location, coordinates) => {
                      handleStartLocationChange(location, coordinates);
                    }}
                    className="w-full"
                    placeholder={t('roadTrip.locations.startPlaceholder')}
                  />
                </div>
                
              </div>
            </div>

            {/* Intermediate Stops */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('roadTrip.locations.stops')}</h2>
              
              {/* Existing Stops */}
              {intermediateLocations.length > 0 && (
                <div className="space-y-3">
                  {intermediateLocations.map((stop, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                        {stop.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveIntermediateLocation(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Stop */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSearch
                    value={newLocation}
                    onChange={(location, coordinates) => {
                      setNewLocation(location);
                      setNewCoordinates(coordinates);
                    }}
                    className="w-full"
                    placeholder={t('roadTrip.locations.stopsPlaceholder')}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddIntermediateLocation}
                  disabled={!newLocation || newCoordinates[0] === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('roadTrip.locations.addStop')}
                </Button>
              </div>
            </div>

            {/* End Location */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('roadTrip.locations.end')}</h2>
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSearch
                    value={endLocation}
                    onChange={(location, coordinates) => {
                      handleEndLocationChange(location, coordinates);
                    }}
                    className="w-full"
                    placeholder={t('roadTrip.locations.endPlaceholder')}
                  />
                </div>

              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          <Button
            variant="ghost"
            className="text-[#61936f] hover:text-[#4a7256]"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('Back')}
          </Button>

          {isValid && (
            <Button
              className="bg-[#61936f] hover:bg-[#4a7256] text-white"
              onClick={onContinue}
            >
              {t('Continue')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

RoadTripLocations.displayName = 'RoadTripLocations';

export default RoadTripLocations; 