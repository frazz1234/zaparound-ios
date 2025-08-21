import React, { forwardRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Crosshair, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { countryCurrencyMap } from '../subtrip-utils/helpers';
import useTranslatedData from '../subtrip-utils/data';

interface TravelLogisticsProps {
  departureLocation: string;
  isLocating: boolean;
  transportMode: string | null;
  isElectricCar: boolean;
  isCarpool: boolean;
  onDepartureLocationChange: (location: string, coordinates: [number, number]) => void;
  onLocateMe: () => void;
  onTransportModeChange: (mode: string) => void;
  onElectricCarChange: (checked: boolean) => void;
  onCarpoolChange: (checked: boolean) => void;
  onCurrencyChange?: (currencyCode: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const TravelLogistics = forwardRef<HTMLDivElement, TravelLogisticsProps>(({
  departureLocation,
  isLocating,
  transportMode,
  isElectricCar,
  isCarpool,
  onDepartureLocationChange,
  onLocateMe,
  onTransportModeChange,
  onElectricCarChange,
  onCarpoolChange,
  onCurrencyChange,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const { transportOptions } = useTranslatedData();
  
  // Function to update currency based on coordinates
  const updateCurrencyFromCoordinates = (coordinates: [number, number]) => {
    if (!onCurrencyChange) return;
    
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
  };

  // Handle departure location change with currency update
  const handleLocationChange = (location: string, coordinates: [number, number]) => {
    onDepartureLocationChange(location, coordinates);
    if (coordinates[0] !== 0 && coordinates[1] !== 0) {
      updateCurrencyFromCoordinates(coordinates);
    }
  };
  
  return (
    <motion.div
      ref={ref}
      key="travel-logistics-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('travel.title')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('travel.description')}
      </p>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-8">
            {/* Departure Location */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('travel.departureFrom')}</h2>
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSearch
                    value={departureLocation}
                    onChange={handleLocationChange}
                    className="w-full"
                    placeholder={t('travel.departureFromPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Transportation Mode */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('travel.transport')}</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {transportOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = transportMode === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => onTransportModeChange(option.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200",
                        "flex flex-col items-center justify-center gap-3",
                        "hover:border-[#61936f] group",
                        isSelected
                          ? "bg-[#61936f]/10 border-[#61936f]"
                          : "bg-white border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        "transition-all duration-200",
                        isSelected
                          ? "bg-[#61936f] text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-[#61936f]/10 group-hover:text-[#61936f]"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={cn(
                        "text-lg font-medium",
                        isSelected
                          ? "text-[#61936f]"
                          : "text-gray-700 group-hover:text-[#61936f]"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Car Options - Show only when car is selected */}
            {transportMode === 'car' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-medium text-[#1d1d1e]">{t('travel.carOptions')}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="electric-car" 
                      checked={isElectricCar}
                      onCheckedChange={onElectricCarChange}
                    />
                    <Label htmlFor="electric-car">{t('travel.electricCar')}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="carpool" 
                      checked={isCarpool}
                      onCheckedChange={onCarpoolChange}
                    />
                    <Label htmlFor="carpool">{t('travel.carpool')}</Label>
                  </div>
                </div>
              </div>
            )}
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

          <Button
            className="bg-[#61936f] hover:bg-[#4a7256] text-white"
            onClick={onContinue}
          >
            {t('Continue')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

TravelLogistics.displayName = 'TravelLogistics';

export default TravelLogistics; 