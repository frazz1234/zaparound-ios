import { useTranslation } from 'react-i18next';
import { TripType } from "@/components/trips/TripTypeSelector";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ZapOutFormSubmissionProps {
  currentPage: number;
  tripType: TripType | null;
  title: string;
  location: string;
  description: string;
  activityTimes: string[];
  includeLunch: boolean;
  lunchOption: string;
  activityTypes: string[];
  includeBudgetPerPerson: boolean;
  budgetPerPerson: string;
  additionalNeeds: string;
  onDescriptionChange: (value: string) => void;
  onNext: () => void;
  onSubmit: (e: React.FormEvent) => void;
  validateAndProcessPage: (props: any) => boolean;
}

export function useZapOutFormSubmission({
  currentPage,
  tripType,
  title,
  location,
  description,
  activityTimes,
  includeLunch,
  lunchOption,
  activityTypes,
  includeBudgetPerPerson,
  budgetPerPerson,
  additionalNeeds,
  onDescriptionChange,
  onNext,
  onSubmit,
  validateAndProcessPage
}: ZapOutFormSubmissionProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();

  // Memoize handleNextPage to prevent unnecessary re-renders
  const handleNextPage = useCallback(() => {
    // Proceed to next page
    onNext();
  }, [currentPage, title, location, activityTimes, activityTypes, includeBudgetPerPerson, budgetPerPerson, additionalNeeds, onNext]);

  // Memoize handleSubmit to prevent unnecessary re-renders
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentPage < 4) {
      handleNextPage();
    } else {
      // For the final page submission
      // Keep the original description (don't add ZapOut data as JSON)
      // This will be stored in the zapout_data table after trip creation
      
      // Continue with standard form submission
      onSubmit(e);
    }
  }, [currentPage, handleNextPage, activityTimes, includeLunch, lunchOption, activityTypes, includeBudgetPerPerson, budgetPerPerson, additionalNeeds, description, onDescriptionChange, onSubmit]);

  return {
    handleNextPage,
    handleSubmit
  };
}
