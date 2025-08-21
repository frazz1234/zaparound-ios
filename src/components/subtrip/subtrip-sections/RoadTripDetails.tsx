import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useTranslatedData from '../subtrip-utils/data';

interface RoadTripDetailsProps {
  adultCount: number;
  childCount: number;
  maxBudget: string;
  selectedCurrency: string;
  currencySymbol: string;
  onAdultCountChange: (value: number) => void;
  onChildCountChange: (value: number) => void;
  onMaxBudgetChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const RoadTripDetails = forwardRef<HTMLDivElement, RoadTripDetailsProps>(({
  adultCount,
  childCount,
  maxBudget,
  selectedCurrency,
  currencySymbol,
  onAdultCountChange,
  onChildCountChange,
  onMaxBudgetChange,
  onCurrencyChange,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const { currencies } = useTranslatedData();
  
  return (
    <motion.div
      ref={ref}
      key="road-trip-details-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('roadTrip.details.title')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('roadTrip.details.description')}
      </p>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-8">
            {/* Number of People */}
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

            {/* Budget Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#1d1d1e]">
                {t('budget.perPersonTitle')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="maxBudget">{t('budget.maxPerActivity')}</Label>
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
            {t('createZapRoad')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

RoadTripDetails.displayName = 'RoadTripDetails';

export default RoadTripDetails; 