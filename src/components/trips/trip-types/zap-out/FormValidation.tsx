import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { TripType } from "@/components/trips/TripTypeSelector";

interface ValidateZapOutFormProps {
  currentPage: number;
  tripType: TripType | null;
  title?: string;
  location?: string;
  activityTimes?: string[];
  activityTypes?: string[];
  includeBudgetPerPerson?: boolean;
  budgetPerPerson?: string;
  category?: string;
  budget?: string;
  transportationMode?: string;
  accommodationType?: string;
}

export function useZapOutFormValidation() {
  const { t } = useTranslation('trip');
  const { toast } = useToast();
  
  const validateAndProcessPage = ({
    currentPage,
    tripType,
    title,
    location,
    activityTimes,
    activityTypes,
    includeBudgetPerPerson,
    budgetPerPerson,
    category,
    budget,
    transportationMode,
    accommodationType
  }: ValidateZapOutFormProps): boolean => {
    
    // Simple validation for each page as needed
    switch (currentPage) {
      case 1: // Basic info page
        if (!title || title.trim() === '' || !location || location.trim() === '') {
          toast({
            title: t('trip.form.required'),
            description: t('trip.form.requiredFields'),
            variant: "destructive",
          });
          return false;
        }
        break;
      
      case 2: // Activity page
        if (activityTimes && activityTimes.length === 0) {
          toast({
            title: t('trip.form.required'),
            description: t('trip.form.requiredFields'),
            variant: "destructive",
          });
          return false;
        }
        
        if (includeBudgetPerPerson && (!budgetPerPerson || budgetPerPerson.trim() === '')) {
          toast({
            title: t('trip.form.required'),
            description: t('trip.form.requiredFields'),
            variant: "destructive",
          });
          return false;
        }
        break;
        
      // Add cases for other pages if needed
    }
    
    // If we reach here, validation passed
    return true;
  };

  return { validateAndProcessPage };
}
