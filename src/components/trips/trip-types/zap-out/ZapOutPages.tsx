
import { TripType } from "../../TripTypeSelector";
import { TripTypeSelectionPage } from "../../form-pages/TripTypeSelectionPage";
import { ZapOutBasicInfoPage } from "../../form-pages/ZapOutBasicInfoPage";
import { ZapOutActivityPage } from "../../form-pages/ZapOutActivityPage";
import { PersonDatePage } from "../../form-pages/zap-out/PersonDatePage";
import { AdditionalNeedsPage } from "../../form-pages/zap-out/AdditionalNeedsPage";

interface ZapOutPagesProps {
  currentPage: number;
  title: string;
  location: string;
  coordinates: [number, number];
  activityTimes: string[];
  includeLunch: boolean;
  lunchOption: string;
  activityTypes: string[];
  includeBudgetPerPerson: boolean;
  budgetPerPerson: string;
  additionalNeeds: string;
  category: string;
  budget: string;
  transportationMode: string;
  transportationDetails: string;
  accommodationType: string;
  accommodationDetails: string;
  startDate?: Date;
  endDate?: Date;
  adults: number;
  kids: number;
  isLoading: boolean;
  tripType: TripType | null;
  onTitleChange: (value: string) => void;
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  onActivityTimesChange: (times: string[]) => void;
  onIncludeLunchChange: (value: boolean) => void;
  onLunchOptionChange: (value: string) => void;
  onActivityTypesChange: (types: string[]) => void;
  onIncludeBudgetPerPersonChange: (value: boolean) => void;
  onBudgetPerPersonChange: (value: string) => void;
  onAdditionalNeedsChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onTransportationModeChange: (value: string) => void;
  onTransportationDetailsChange: (value: string) => void;
  onAccommodationTypeChange: (value: string) => void;
  onAccommodationDetailsChange: (value: string) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onTripTypeChange: (type: TripType) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ZapOutPages({
  currentPage,
  title,
  location,
  coordinates,
  activityTimes,
  includeLunch,
  lunchOption,
  activityTypes,
  includeBudgetPerPerson,
  budgetPerPerson,
  additionalNeeds,
  category,
  budget,
  transportationMode,
  transportationDetails,
  accommodationType,
  accommodationDetails,
  startDate,
  endDate,
  adults,
  kids,
  isLoading,
  tripType,
  onTitleChange,
  onLocationChange,
  onActivityTimesChange,
  onIncludeLunchChange,
  onLunchOptionChange,
  onActivityTypesChange,
  onIncludeBudgetPerPersonChange,
  onBudgetPerPersonChange,
  onAdditionalNeedsChange,
  onCategoryChange,
  onBudgetChange,
  onTransportationModeChange,
  onTransportationDetailsChange,
  onAccommodationTypeChange,
  onAccommodationDetailsChange,
  onStartDateChange,
  onEndDateChange,
  onAdultsChange,
  onKidsChange,
  onTripTypeChange,
  onBack,
  onNext,
  onSubmit
}: ZapOutPagesProps) {
  switch (currentPage) {
    case 0:
      return (
        <TripTypeSelectionPage
          tripType={tripType}
          onTripTypeChange={onTripTypeChange}
          onNext={onNext}
          onCancel={onBack}
        />
      );
    case 1:
      return (
        <ZapOutBasicInfoPage
          title={title}
          location={location}
          coordinates={coordinates}
          onTitleChange={onTitleChange}
          onLocationChange={onLocationChange}
          onBack={onBack}
          onNext={onNext}
        />
      );
    case 2:
      return (
        <ZapOutActivityPage
          activityTimes={activityTimes}
          includeLunch={includeLunch}
          lunchOption={lunchOption}
          activityTypes={activityTypes}
          includeBudgetPerPerson={includeBudgetPerPerson}
          budgetPerPerson={budgetPerPerson}
          onActivityTimesChange={onActivityTimesChange}
          onIncludeLunchChange={onIncludeLunchChange}
          onLunchOptionChange={onLunchOptionChange}
          onActivityTypesChange={onActivityTypesChange}
          onIncludeBudgetPerPersonChange={onIncludeBudgetPerPersonChange}
          onBudgetPerPersonChange={onBudgetPerPersonChange}
          onBack={onBack}
          onNext={onNext}
        />
      );
    case 3:
      return (
        <PersonDatePage
          startDate={startDate}
          endDate={endDate}
          adults={adults}
          kids={kids}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onAdultsChange={onAdultsChange}
          onKidsChange={onKidsChange}
          onBack={onBack}
          onNext={onNext}
        />
      );
    case 4:
      return (
        <AdditionalNeedsPage
          additionalNeeds={additionalNeeds}
          onAdditionalNeedsChange={onAdditionalNeedsChange}
          onBack={onBack}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      );
    default:
      return null;
  }
}
