import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { pageVariants } from '../subtrip-utils/animations';
import { PawPrint } from 'lucide-react';

interface PetQuestionProps {
  selectedActivity: 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip' | null;
  onSetHasPets: (value: boolean) => void;
  onBack: () => void;
}

const PetQuestion = ({ selectedActivity, onSetHasPets, onBack }: PetQuestionProps) => {
  const { t } = useTranslation('home');

  const getTitle = () => {
    switch (selectedActivity) {
      case 'plan-trip':
        return t('activity.petsQuestion.trip');
      case 'tinder-date':
        return t('activity.petsQuestion.tinderDate');
      case 'friends':
        return t('activity.petsQuestion.activity');
      case 'roadtrip':
        return t('activity.petsQuestion.roadTrip');
      default:
        return t('activity.petsQuestion.default');
    }
  };

  const getDescription = () => {
    switch (selectedActivity) {
      case 'plan-trip':
        return t('activity.petsQuestion.description');
      case 'tinder-date':
        return t('activity.petsQuestion.description');
      case 'friends':
        return t('activity.petsQuestion.description');
      case 'roadtrip':
        return t('activity.petsQuestion.description');
      default:
        return t('activity.petsQuestion.description');
    }
  };

  return (
    <motion.div
      key="pet-question-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="text-center mb-8 md:mb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-3 p-3 rounded-full bg-[#61936f]/10 backdrop-blur-sm"
        >
          <PawPrint className="h-6 w-6 md:h-7 md:w-7 text-white" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          {getTitle()}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
        >
          {getDescription()}
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto"
      >
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-auto px-8 py-6 rounded-xl text-lg font-medium min-w-[160px]",
            "bg-white/95 backdrop-blur-sm border-2 border-[#61936f] text-[#61936f]",
            "transition-all duration-300 transform hover:scale-[1.02]",
            "hover:bg-[#61936f] hover:text-white"
          )}
          onClick={() => onSetHasPets(true)}
        >
          {t('activity.petsOptions.yes')}
        </Button>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-auto px-8 py-6 rounded-xl text-lg font-medium min-w-[160px]",
            "bg-white/95 backdrop-blur-sm border-2 border-[#61936f] text-[#61936f]",
            "transition-all duration-300 transform hover:scale-[1.02]",
            "hover:bg-[#61936f] hover:text-white"
          )}
          onClick={() => onSetHasPets(false)}
        >
          {t('activity.petsOptions.no')}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex justify-center"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:text-[#61936f] hover:bg-white/10"
        >
          {t('common.back')}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PetQuestion; 