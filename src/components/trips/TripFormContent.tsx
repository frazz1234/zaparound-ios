import { TripType } from "./TripTypeSelector";
import { ZapTripFormContent } from "./trip-types/zap-trip/ZapTripFormContent";
import { ZapOutFormContent } from "./trip-types/zap-out/ZapOutFormContent";
import { ZapRoadFormContent } from "./trip-types/zap-road/ZapRoadFormContent";
import { useTranslation } from 'react-i18next';

interface TripFormContentProps {
  currentPage: number;
  title: string;
  description: string;
  location: string;
  startDate?: Date;
  endDate?: Date;
  category: string;
  budget: string;
  transportationMode: string;
  transportationDetails: string;
  accommodationType: string;
  accommodationDetails: string;
  notes?: string;
  adults: number;
  kids: number;
  isLoading: boolean;
  coordinates: [number, number];
  tripType: TripType | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onCategoryChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onTransportationModeChange: (value: string) => void;
  onTransportationDetailsChange: (value: string) => void;
  onAccommodationTypeChange: (value: string) => void;
  onAccommodationDetailsChange: (value: string) => void;
  onNotesChange?: (value: string) => void;
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onTripTypeChange: (type: TripType) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TripFormContent(props: TripFormContentProps) {
  const { t } = useTranslation('trip');
  
  // When the trip type is selected, render the appropriate form content
  if (props.tripType === "ZapRoad") {
    return <ZapRoadFormContent {...props} />;
  } else if (props.tripType === "ZapOut") {
    return <ZapOutFormContent {...props} />;
  } else if (props.tripType === "ZapTrip" || (props.currentPage === 0 && !props.tripType)) {
    return <ZapTripFormContent {...props} />;
  }
  
  // Default to ZapTrip as fallback
  return <ZapTripFormContent {...props} />;
}
