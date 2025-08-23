import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface ActivityTimeSelectorProps {
  selectedTimes: string[];
  onSelectTime: (timeId: string) => void;
  onBack: () => void;
  onContinue: () => void;
  isHomepage?: boolean; // New prop to detect if this is on the homepage
}

const ActivityTimeSelector = ({
  selectedTimes,
  onSelectTime,
  onBack,
  onContinue,
  isHomepage = false
}: ActivityTimeSelectorProps) => {
  const { t } = useTranslation('trip');

  const activityTimeOptions = [
    { id: "morning", label: t("types.zapOut.details.morning") },
    { id: "afternoon", label: t("types.zapOut.details.afternoon") },
    { id: "evening", label: t("types.zapOut.details.evening") },
    { id: "nightlife", label: t("types.zapOut.details.nightlife") },
    { id: "allDay", label: t("types.zapOut.details.allDay") },
  ];

  return (
    <div className={cn(
      "hero-card w-full",
      isHomepage 
        ? "bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl" // Enhanced styling for homepage
        : "bg-black/30 backdrop-blur-sm", // Regular background for other pages
      "p-4 sm:p-6 rounded-xl",
      "my-2 sm:my-4",
      "flex flex-col items-center justify-center gap-4",
      isHomepage && "ring-1 ring-white/5" // Subtle ring for homepage
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-4"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "inline-block mb-3 p-3 rounded-full bg-[#61936f]/10 backdrop-blur-sm",
            "flex items-center justify-center",
            "w-6 h-6 md:w-7 md:h-7"
          )}
        >
          <Clock className="h-6 w-6 md:h-7 md:w-7 text-white" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
        >
          {t('form.activityTime.title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-white/80 mb-8 text-center"
        >
          {t('form.activityTime.subtitle')}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
        >
          {activityTimeOptions.map((option) => (
            <Button
              key={option.id}
              onClick={() => onSelectTime(option.id)}
              className={cn(
                "w-full p-6 text-lg font-medium rounded-xl",
                "transition-all duration-300",
                "flex items-center justify-center gap-3",
                selectedTimes.includes(option.id)
                  ? "bg-[#61936f] text-white hover:bg-[#4a7256] shadow-lg shadow-[#61936f]/30"
                  : isHomepage 
                    ? "bg-white/15 text-white hover:bg-white/25 border border-white/20" // Enhanced styling for homepage
                    : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {option.label}
            </Button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-white hover:text-[#61936f] hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('form.back')}
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            disabled={selectedTimes.length === 0}
            className={cn(
              "px-8 py-6 rounded-xl text-lg font-medium min-w-[200px]",
              "bg-[#61936f] hover:bg-[#4a7256] text-white",
              isHomepage 
                ? "shadow-2xl shadow-[#61936f]/40 hover:shadow-3xl hover:shadow-[#61936f]/50" // Enhanced shadow for homepage
                : "shadow-lg shadow-[#61936f]/20 hover:shadow-xl hover:shadow-[#61936f]/30",
              "transform transition-all duration-300 hover:scale-[1.02]",
              selectedTimes.length === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            {t('form.next')}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ActivityTimeSelector; 