import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import useTranslatedData from '../subtrip-utils/data';

interface AccommodationSelectorProps {
  accommodation: string | null;
  onAccommodationChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const AccommodationSelector = forwardRef<HTMLDivElement, AccommodationSelectorProps>(({
  accommodation,
  onAccommodationChange,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const { accommodationOptions } = useTranslatedData();
  
  return (
    <motion.div
      ref={ref}
      key="accommodation-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('accommodation.title')}
      </h1>
      


      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {accommodationOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = accommodation === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => onAccommodationChange(option.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200",
                      "flex flex-col items-center justify-center gap-3",
                      "hover:border-[#61936f] group h-full",
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
                    <div className="text-center">
                      <span className={cn(
                        "text-lg font-medium block",
                        isSelected
                          ? "text-[#61936f]"
                          : "text-gray-700 group-hover:text-[#61936f]"
                      )}>
                        {option.label}
                      </span>
                      <span className="text-sm text-gray-500 mt-1 block">{option.description}</span>
                    </div>
                  </button>
                );
              })}
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
            {t('Continue')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

AccommodationSelector.displayName = 'AccommodationSelector';

export default AccommodationSelector; 