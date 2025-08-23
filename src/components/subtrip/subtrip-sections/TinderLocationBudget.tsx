import React, { forwardRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LocationSearch } from "@/components/trips/LocationSearch";
import { Crosshair } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryCurrencyMap } from '../subtrip-utils/helpers';
import useTranslatedData from '../subtrip-utils/data';
import { Switch } from "@/components/ui/switch";

interface TinderLocationBudgetProps {
  selectedActivity: 'tinder-date' | 'friends' | null;
  tinderLocation: string;
  tinderCoordinates: [number, number];
  minBudget: string;
  maxBudget: string;
  selectedCurrency: string;
  currencySymbol: string;
  isTinderLocating: boolean;
  adultCount: number;
  childCount: number;
  onTinderLocationChange: (location: string, coordinates: [number, number]) => void;
  onTinderLocateMe: () => void;
  onMinBudgetChange: (value: string) => void;
  onMaxBudgetChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onAdultCountChange: (value: number) => void;
  onChildCountChange: (value: number) => void;
  onBack: () => void;
  onContinue: () => void;
  showBudget: boolean;
  setShowBudget: (value: boolean) => void;
}

const TinderLocationBudget = forwardRef<HTMLDivElement, TinderLocationBudgetProps>(({
  selectedActivity,
  tinderLocation,
  tinderCoordinates,
  minBudget,
  maxBudget,
  selectedCurrency,
  currencySymbol,
  isTinderLocating,
  adultCount,
  childCount,
  onTinderLocationChange,
  onTinderLocateMe,
  onMinBudgetChange,
  onMaxBudgetChange,
  onCurrencyChange,
  onAdultCountChange,
  onChildCountChange,
  onBack,
  onContinue,
  showBudget,
  setShowBudget
}, ref) => {
  const { t } = useTranslation('home');
  const { currencies } = useTranslatedData();
  
  const isValid = !!tinderLocation;

  // Update currency when coordinates change
  useEffect(() => {
    if (tinderCoordinates && tinderCoordinates[0] !== 0 && tinderCoordinates[1] !== 0) {
      // Get country from coordinates using reverse geocoding
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${tinderCoordinates[1]},${tinderCoordinates[0]}.json?access_token=pk.eyJ1IjoibWlzdGVyZnJhenoiLCJhIjoiY203M2ZnM3BoMDhpMTJqcTNiYWpkamIzNyJ9.2SlcuEPIL2yCJw5TIPunVQ&types=country`
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
  }, [tinderCoordinates, onCurrencyChange]);

  // Handle location change with currency update
  const handleLocationChange = (newLocation: string, newCoordinates: [number, number]) => {
    onTinderLocationChange(newLocation, newCoordinates);
  };

  return (
    <motion.div
      ref={ref}
      key="tinder-location-budget-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {selectedActivity === 'tinder-date' 
          ? t('tinderLocation.title.date')
          : t('tinderLocation.title.friends')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('tinderLocation.description')}
      </p>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-8">
            {/* Location Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('location.choose')}</h2>
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocationSearch
                    value={tinderLocation}
                    onChange={handleLocationChange}
                    className="w-full"
                    placeholder={t('tinderLocation.placeholder')}
                  />
                </div>
              </div>
            </div>

            {/* Number of People - Only for friends activity */}
            {selectedActivity === 'friends' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#1d1d1e] text-center">{t('people.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center justify-center h-8">{t('people.adults')}</Label>
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onAdultCountChange(Math.max(1, adultCount - 1))}
                        disabled={adultCount <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center flex items-center justify-center">{adultCount}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onAdultCountChange(adultCount + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center justify-center h-8">{t('people.children')}</Label>
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onChildCountChange(Math.max(0, childCount - 1))}
                        disabled={childCount <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center flex items-center justify-center">{childCount}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onChildCountChange(childCount + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Budget Toggle */}
            <div className="flex items-center gap-4">
              <Switch id="showBudget" checked={showBudget} onCheckedChange={setShowBudget} />
              <Label htmlFor="showBudget" className="text-lg text-[#1d1d1e] cursor-pointer">
                {t('budget.addBudget', 'Add budget?')}
              </Label>
            </div>

            {/* Budget Section - only if showBudget is true */}
            {showBudget && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#1d1d1e]">{t('budget.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('budget.currency')}</Label>
                    <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder={t('budget.selectCurrency')} />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minBudget">{t('budget.min')}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {currencySymbol}
                      </span>
                      <Input
                        id="minBudget"
                        type="number"
                        value={minBudget}
                        onChange={(e) => onMinBudgetChange(e.target.value)}
                        className="pl-7"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBudget">{t('budget.max')}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {currencySymbol}
                      </span>
                      <Input
                        id="maxBudget"
                        type="number"
                        value={maxBudget}
                        onChange={(e) => onMaxBudgetChange(e.target.value)}
                        className="pl-7"
                        placeholder="100"
                        min="0"
                      />
                    </div>
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
          {isValid && (
            <Button
              className="bg-[#61936f] hover:bg-[#4a7256] text-white"
              onClick={onContinue}
            >
              {t('createZapOut')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

TinderLocationBudget.displayName = 'TinderLocationBudget';

export default TinderLocationBudget; 