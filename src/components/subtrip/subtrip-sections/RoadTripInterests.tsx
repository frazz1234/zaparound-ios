import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import useTranslatedData from '../subtrip-utils/data';

interface RoadTripInterestsProps {
  selectedRoadTripInterests: string[];
  onSelectInterest: (interestId: string) => void;
  expandedCategory: string | null;
  onToggleCategory: (category: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const RoadTripInterests = forwardRef<HTMLDivElement, RoadTripInterestsProps>(({
  selectedRoadTripInterests,
  onSelectInterest,
  expandedCategory,
  onToggleCategory,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const { roadTripInterestCategories } = useTranslatedData();
  
  const getPluralText = (count: number) => {
    return count === 1 ? "interest" : "interests";
  };

  const MAX_SELECTIONS = 5;

  return (
    <motion.div
      ref={ref}
      key="road-trip-interests-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('roadTrip.interests.title')}
      </h1>
      
      <p className="text-lg text-white mb-8">
        {t('roadTrip.interests.description')}
      </p>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-white text-sm">
            {t('roadTrip.interests.maxSelection', {
              max: MAX_SELECTIONS,
              selected: selectedRoadTripInterests.length
            })}
          </p>
        </div>

        <Card className="bg-white shadow-lg w-full p-6">
          <div className="flex flex-col space-y-4">
            {roadTripInterestCategories.map((category) => (
              <div key={category.category} className="border rounded-lg overflow-hidden">
                <div 
                  className={cn(
                    "px-4 py-3 flex justify-between items-center cursor-pointer",
                    "transition-colors duration-150",
                    "hover:bg-gray-50",
                    expandedCategory === category.category ? "bg-gray-50" : "bg-white"
                  )}
                  onClick={() => onToggleCategory(category.category)}
                >
                  <h3 className="text-lg font-medium text-[#1d1d1e]">
                    {category.category === 'scenicNature' ? t('roadTrip.interests.category.scenicNature') :
                     category.category === 'places' ? t('roadTrip.interests.category.places') :
                     category.category === 'activities' ? t('roadTrip.interests.category.activities') :
                     category.category}
                  </h3>
                  {expandedCategory === category.category ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </div>
                
                {expandedCategory === category.category && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 py-3 bg-gray-50"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {category.items.map((interest) => {
                        const isSelected = selectedRoadTripInterests.includes(interest.id);
                        const Icon = interest.icon;
                        
                        return (
                          <button
                            key={interest.id}
                            onClick={() => onSelectInterest(interest.id)}
                            disabled={!isSelected && selectedRoadTripInterests.length >= 5}
                            className={cn(
                              "p-3 rounded-lg border-2 transition-all duration-200",
                              "flex flex-col items-center justify-center gap-2 text-center",
                              "hover:border-[#61936f] group",
                              isSelected
                                ? "bg-[#61936f]/10 border-[#61936f]"
                                : !isSelected && selectedRoadTripInterests.length >= 5
                                  ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
                                  : "bg-white border-gray-200"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              "transition-all duration-200",
                              isSelected
                                ? "bg-[#61936f] text-white"
                                : "bg-gray-100 text-gray-600 group-hover:bg-[#61936f]/10 group-hover:text-[#61936f]"
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-[#61936f]"
                                : "text-gray-700 group-hover:text-[#61936f]"
                            )}>
                              {t(`${interest.label}`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
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
            {t('continue')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

RoadTripInterests.displayName = 'RoadTripInterests';

export default RoadTripInterests; 