import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import useTranslatedData from '../subtrip-utils/data';
import { ActivityType } from '../subtrip-types';

interface TinderOptionsProps {
  selectedActivity: ActivityType | null;
  selectedTinderOptions: string[];
  onSelectOption: (optionId: string) => void;
  onOpenCustomActivityDialog: () => void;
  customActivities: string[];
  onBack: () => void;
  onContinue: () => void;
}

const TinderOptions = forwardRef<HTMLDivElement, TinderOptionsProps>(({
  selectedActivity,
  selectedTinderOptions,
  onSelectOption,
  onOpenCustomActivityDialog,
  customActivities,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const { tinderOptions } = useTranslatedData();
  const MAX_SELECTIONS = 3;

  return (
    <motion.div
      ref={ref}
      key="tinder-options-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {selectedActivity === 'tinder-date' 
          ? t('calendar.title.tinderDate')
          : selectedActivity === 'friends'
          ? t('calendar.title.friends')
          : t('calendar.title.trip')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('interests.maxSelection', { max: MAX_SELECTIONS, selected: selectedTinderOptions.length })}
      </p>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3">
          {tinderOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedTinderOptions.includes(option.id);
            const canSelect = selectedTinderOptions.length < MAX_SELECTIONS || isSelected;
            
            if (option.id === 'other') {
              return (
                <button
                  key={option.id}
                  onClick={onOpenCustomActivityDialog}
                  className={cn(
                    "px-6 py-3 rounded-full border-2 transition-all duration-200",
                    "flex items-center gap-2",
                    "hover:border-[#61936f] hover:bg-[#61936f]/5",
                    "bg-white border-gray-200 text-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-base font-medium whitespace-nowrap">
                    {option.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={option.id}
                onClick={() => onSelectOption(option.id)}
                disabled={!canSelect && !isSelected}
                className={cn(
                  "px-6 py-3 rounded-full border-2 transition-all duration-200",
                  "flex items-center gap-2",
                  "hover:border-[#61936f] hover:bg-[#61936f]/5",
                  isSelected
                    ? "bg-[#61936f]/10 border-[#61936f] text-[#61936f]"
                    : "bg-white border-gray-200 text-gray-700",
                  !canSelect && !isSelected && "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-base font-medium whitespace-nowrap">
                  {option.label}
                </span>
                {isSelected && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-[#61936f] text-white text-sm">
                    {selectedTinderOptions.indexOf(option.id) + 1}
                  </span>
                )}
              </button>
            );
          })}

          {customActivities.map((activity, index) => (
            <div
              key={`custom-${index}`}
              className={cn(
                "px-6 py-3 rounded-full border-2",
                "flex items-center gap-2",
                "bg-[#61936f]/10 border-[#61936f] text-[#61936f]"
              )}
            >
              <span className="text-base font-medium whitespace-nowrap">
                {activity}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          <Button
            variant="ghost"
            className="text-[#61936f] hover:text-[#4a7256]"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('Back')}
          </Button>

          {selectedTinderOptions.length > 0 && (
            <Button
              className="bg-[#61936f] hover:bg-[#4a7256] text-white"
              onClick={onContinue}
            >
              {t('interests.continue', { 
                count: selectedTinderOptions.length,
                pluralKey: selectedTinderOptions.length === 1 ? 'interest' : 'interests'
              })}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

TinderOptions.displayName = 'TinderOptions';

export default TinderOptions; 