import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../subtrip-utils/animations';
import { cn } from "@/lib/utils";
import useTranslatedData from '../subtrip-utils/data';

interface TripInterestsProps {
  selectedTripInterests: string[];
  onSelectInterest: (interestId: string) => void;
  expandedCategory: string | null;
  onToggleCategory: (category: string) => void;
  maxSelections: number;
  onBack: () => void;
  onContinue: () => void;
}

const TripInterests = forwardRef<HTMLDivElement, TripInterestsProps>(({
  selectedTripInterests,
  onSelectInterest,
  expandedCategory,
  onToggleCategory,
  maxSelections,
  onBack,
  onContinue
}, ref) => {
  const { t } = useTranslation('home');
  const { tripInterests } = useTranslatedData();

  // Get selected interests with their icons and categories
  const selectedInterestsWithDetails = selectedTripInterests.map(interestId => {
    for (const category of tripInterests) {
      const interest = category.items.find(item => item.id === interestId);
      if (interest) {
        return {
          id: interestId,
          label: t(`tripInterests.${interestId}`),
          icon: interest.icon,
          category: category.category
        };
      }
    }
    return null;
  }).filter(Boolean);

  // Split categories into two columns
  const midPoint = Math.ceil(tripInterests.length / 2);
  const leftColumn = tripInterests.slice(0, midPoint);
  const rightColumn = tripInterests.slice(midPoint);

  return (
    <motion.div
      ref={ref}
      key="trip-interests-step"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
        {t('interests.title')}
      </h1>
      
      <div className="max-w-4xl mx-auto">
        {/* Selected Interests Section */}
        {selectedInterestsWithDetails.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              {t('interests.selectionCount', {
                selected: selectedInterestsWithDetails.length,
                max: maxSelections
              })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedInterestsWithDetails.map((interest) => {
                const Icon = interest.icon;
                return (
                  <motion.div
                    key={interest.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-[#61936f]/20 border border-[#61936f] rounded-full px-3 py-1.5 flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      {interest.label}
                    </span>
                    <button
                      onClick={() => onSelectInterest(interest.id)}
                      className="ml-1 hover:bg-white/10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="space-y-4 md:space-y-6">
            {leftColumn.map((category) => (
              <div
                key={category.category}
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => onToggleCategory(category.category)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    {t(`tripInterests.${category.category}`)}
                  </h3>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-gray-500 transition-transform duration-200",
                      expandedCategory === category.category ? "rotate-180" : ""
                    )}
                  />
                </button>
                
                <AnimatePresence>
                  {expandedCategory === category.category && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 md:p-4">
                        <div className="flex flex-wrap gap-2">
                          {category.items.map((interest) => {
                            const Icon = interest.icon;
                            const isSelected = selectedTripInterests.includes(interest.id);
                            const isDisabled = !isSelected && selectedTripInterests.length >= maxSelections;
                            
                            return (
                              <button
                                key={interest.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectInterest(interest.id);
                                }}
                                disabled={isDisabled}
                                className={cn(
                                  "px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 transition-all duration-200",
                                  "flex items-center gap-2",
                                  "hover:border-[#61936f] hover:bg-[#61936f]/5",
                                  isSelected
                                    ? "bg-[#61936f]/10 border-[#61936f] text-[#61936f]"
                                    : isDisabled
                                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-white border-gray-200 text-gray-700"
                                )}
                              >
                                <Icon className={cn(
                                  "w-4 h-4",
                                  isDisabled && "text-gray-400"
                                )} />
                                <span className={cn(
                                  "text-sm font-medium",
                                  isSelected
                                    ? "text-[#61936f]"
                                    : isDisabled
                                      ? "text-gray-400"
                                      : "text-gray-700 group-hover:text-[#61936f]"
                                )}>
                                  {t(`tripInterests.${interest.id}`)}
                                </span>
                                {isSelected && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#61936f] text-white text-xs"
                                  >
                                    ✓
                                  </motion.span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-4 md:space-y-6">
            {rightColumn.map((category) => (
              <div
                key={category.category}
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => onToggleCategory(category.category)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    {t(`tripInterests.${category.category}`)}
                  </h3>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-gray-500 transition-transform duration-200",
                      expandedCategory === category.category ? "rotate-180" : ""
                    )}
                  />
                </button>
                
                <AnimatePresence>
                  {expandedCategory === category.category && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 md:p-4">
                        <div className="flex flex-wrap gap-2">
                          {category.items.map((interest) => {
                            const Icon = interest.icon;
                            const isSelected = selectedTripInterests.includes(interest.id);
                            const isDisabled = !isSelected && selectedTripInterests.length >= maxSelections;
                            
                            return (
                              <button
                                key={interest.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectInterest(interest.id);
                                }}
                                disabled={isDisabled}
                                className={cn(
                                  "px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 transition-all duration-200",
                                  "flex items-center gap-2",
                                  "hover:border-[#61936f] hover:bg-[#61936f]/5",
                                  isSelected
                                    ? "bg-[#61936f]/10 border-[#61936f] text-[#61936f]"
                                    : isDisabled
                                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-white border-gray-200 text-gray-700"
                                )}
                              >
                                <Icon className={cn(
                                  "w-4 h-4",
                                  isDisabled && "text-gray-400"
                                )} />
                                <span className={cn(
                                  "text-sm font-medium",
                                  isSelected
                                    ? "text-[#61936f]"
                                    : isDisabled
                                      ? "text-gray-400"
                                      : "text-gray-700 group-hover:text-[#61936f]"
                                )}>
                                  {t(`tripInterests.${interest.id}`)}
                                </span>
                                {isSelected && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#61936f] text-white text-xs"
                                  >
                                    ✓
                                  </motion.span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
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
            className={cn(
              "bg-[#61936f] hover:bg-[#4a7256] text-white",
              selectedTripInterests.length === 0 && "opacity-50 cursor-not-allowed"
            )}
            onClick={onContinue}
            disabled={selectedTripInterests.length === 0}
          >
            {t('continueOnly')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

TripInterests.displayName = 'TripInterests';

export default TripInterests; 