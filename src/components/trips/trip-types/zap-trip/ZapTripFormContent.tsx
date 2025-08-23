import { TripType } from "../../TripTypeSelector";
import { TripTypeSelectionPage } from "../../form-pages/TripTypeSelectionPage";
import { TripBasicInfoPage } from "../../form-pages/TripBasicInfoPage";
import { TripDetailsPage } from "../../form-pages/TripDetailsPage";

interface ZapTripFormContentProps {
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

export function ZapTripFormContent({
  currentPage,
  title,
  description,
  location,
  startDate,
  endDate,
  category,
  budget,
  transportationMode,
  transportationDetails,
  accommodationType,
  accommodationDetails,
  notes,
  adults,
  kids,
  isLoading,
  coordinates,
  tripType,
  onTitleChange,
  onDescriptionChange,
  onLocationChange,
  onStartDateChange,
  onEndDateChange,
  onCategoryChange,
  onBudgetChange,
  onTransportationModeChange,
  onTransportationDetailsChange,
  onAccommodationTypeChange,
  onAccommodationDetailsChange,
  onNotesChange,
  onAdultsChange,
  onKidsChange,
  onTripTypeChange,
  onNext,
  onBack,
  onCancel,
  onSubmit
}: ZapTripFormContentProps) {

  const handleNextPage = () => {
    if (currentPage === 0 && !tripType) {
      return;
    }
    if (currentPage === 1 && (!title || !location || !startDate || !endDate)) {
      return;
    }
    onNext();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPage === 0) {
      handleNextPage();
    } else if (currentPage === 1) {
      handleNextPage();
    } else {
      if (!category || !budget || !transportationMode || !accommodationType) {
        return;
      }
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="px-1 sm:px-2">
        {currentPage === 0 ? (
          <TripTypeSelectionPage
            tripType={tripType}
            onTripTypeChange={onTripTypeChange}
            onNext={handleNextPage}
            onCancel={onCancel}
          />
        ) : currentPage === 1 ? (
          <TripBasicInfoPage
            title={title}
            description={description}
            location={location}
            startDate={startDate}
            endDate={endDate}
            adults={adults}
            kids={kids}
            coordinates={coordinates}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
            onLocationChange={onLocationChange}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onAdultsChange={onAdultsChange}
            onKidsChange={onKidsChange}
            onNext={handleNextPage}
            onBack={onBack}
          />
        ) : (
          <TripDetailsPage
            category={category}
            budget={budget}
            transportationMode={transportationMode}
            transportationDetails={transportationDetails}
            accommodationType={accommodationType}
            accommodationDetails={accommodationDetails}
            isLoading={isLoading}
            onCategoryChange={onCategoryChange}
            onBudgetChange={onBudgetChange}
            onTransportationModeChange={onTransportationModeChange}
            onTransportationDetailsChange={onTransportationDetailsChange}
            onAccommodationTypeChange={onAccommodationTypeChange}
            onAccommodationDetailsChange={onAccommodationDetailsChange}
            onBack={onBack}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </form>
  );
}
