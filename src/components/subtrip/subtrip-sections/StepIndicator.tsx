import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface StepIndicatorProps {
  currentStep: string;
  selectedActivity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, selectedActivity }) => {
  const { t } = useTranslation('trip');

  // Get total steps based on activity type
  const getTotalSteps = () => {
    if (selectedActivity === 'plan-trip') return 9; // ZapTrip
    if (selectedActivity === 'roadtrip') return 7; // ZapRoad
    if (selectedActivity === 'tinder-date' || selectedActivity === 'friends') return 6; // ZapOut
    return 0; // No steps when no activity is selected
  };

  // Get current step number based on currentStep
  const getCurrentStepNumber = () => {
    const stepMap: { [key: string]: number } = {
      // ZapTrip steps (9 total)
      'activity': 1,
      'title-description': 2,
      'pet-question': 3,
      'location-picker': 4,
      'calendar': 5,
      'trip-interests': 6,
      'travel-logistics': 7,
      'accommodation': 8,
      'people-budget': 9,
      
      // ZapRoad steps (7 total)
      'road-trip-vehicle': 4,
      'road-trip-locations': 5,
      'road-trip-interests': 6,
      'road-trip-details': 7,
      
      // ZapOut steps (6 total)
      'tinder-options': 4,
      'activity-time': 5,
      'tinder-location-budget': 6
    };
    return stepMap[currentStep] || 0;
  };

  // Don't render anything if no activity is selected
  if (!selectedActivity) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="step-indicator flex justify-center items-center gap-2 mb-4"
    >
      <span className="text-sm text-white/60">
        {t('stepIndicator.step')} {getCurrentStepNumber()} {t('stepIndicator.of')} {getTotalSteps()}
      </span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: getTotalSteps() }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              index + 1 === getCurrentStepNumber() ? "bg-[#61936f]" : "bg-white/20"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default StepIndicator; 