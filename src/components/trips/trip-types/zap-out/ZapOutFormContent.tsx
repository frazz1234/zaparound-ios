import { TripType } from "../../TripTypeSelector";
import { useState, useEffect, useMemo } from "react";
import { useZapOutFormValidation } from "./FormValidation";
import { ZapOutPages } from "./ZapOutPages";
import { useZapOutFormSubmission } from "@/hooks/useZapOutFormSubmission";
import { TripFormData } from "@/types/trip";

interface ZapOutFormContentProps {
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
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onTripTypeChange: (type: TripType) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent | { formData: TripFormData }) => void;
}

export function ZapOutFormContent({
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
  onAdultsChange,
  onKidsChange,
  onTripTypeChange,
  onNext,
  onBack,
  onCancel,
  onSubmit
}: ZapOutFormContentProps) {
  const [activityTimes, setActivityTimes] = useState<string[]>([]);
  const [includeLunch, setIncludeLunch] = useState(false);
  const [lunchOption, setLunchOption] = useState("before");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [includeBudgetPerPerson, setIncludeBudgetPerPerson] = useState(false);
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [additionalNeeds, setAdditionalNeeds] = useState("");

  const { validateAndProcessPage } = useZapOutFormValidation();
  
  const formDataValues = useMemo(() => ({
    currentPage,
    tripType,
    title,
    location,
    coordinates,
    adults,
    kids,
    activityTimes,
    includeLunch,
    lunchOption,
    activityTypes,
    includeBudgetPerPerson,
    budgetPerPerson,
    additionalNeeds,
    startDate,
    endDate
  }), [
    currentPage, tripType, title, location, coordinates, adults, kids,
    activityTimes, includeLunch, lunchOption, activityTypes,
    includeBudgetPerPerson, budgetPerPerson, additionalNeeds,
    startDate, endDate
  ]);
  
  const { handleNextPage, handleSubmit } = useZapOutFormSubmission({
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
    onSubmit: (e) => {
      const zapOutFormData: TripFormData = {
        title,
        description,
        location,
        coordinates,
        startDate,
        endDate,
        adults,
        kids,
        activityTimes,
        includeLunch,
        lunchOption,
        activityTypes,
        includeBudgetPerPerson,
        budgetPerPerson,
        additionalNeeds,
        tripType: 'ZapOut' as const
      };
      onSubmit({ formData: zapOutFormData });
    },
    validateAndProcessPage
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mx-[2px]" aria-label="ZapOut Trip Form">
      <ZapOutPages
        currentPage={currentPage}
        title={title}
        location={location}
        coordinates={coordinates}
        activityTimes={activityTimes}
        includeLunch={includeLunch}
        lunchOption={lunchOption}
        activityTypes={activityTypes}
        includeBudgetPerPerson={includeBudgetPerPerson}
        budgetPerPerson={budgetPerPerson}
        category={category}
        budget={budget}
        transportationMode={transportationMode}
        transportationDetails={transportationDetails}
        accommodationType={accommodationType}
        accommodationDetails={accommodationDetails}
        startDate={startDate}
        endDate={endDate}
        adults={adults}
        kids={kids}
        additionalNeeds={additionalNeeds}
        isLoading={isLoading}
        tripType={tripType}
        onTitleChange={onTitleChange}
        onLocationChange={onLocationChange}
        onActivityTimesChange={setActivityTimes}
        onIncludeLunchChange={setIncludeLunch}
        onLunchOptionChange={setLunchOption}
        onActivityTypesChange={setActivityTypes}
        onIncludeBudgetPerPersonChange={setIncludeBudgetPerPerson}
        onBudgetPerPersonChange={setBudgetPerPerson}
        onAdditionalNeedsChange={setAdditionalNeeds}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onAdultsChange={onAdultsChange}
        onKidsChange={onKidsChange}
        onCategoryChange={onCategoryChange}
        onBudgetChange={onBudgetChange}
        onTransportationModeChange={onTransportationModeChange}
        onTransportationDetailsChange={onTransportationDetailsChange}
        onAccommodationTypeChange={onAccommodationTypeChange}
        onAccommodationDetailsChange={onAccommodationDetailsChange}
        onTripTypeChange={onTripTypeChange}
        onBack={onBack}
        onNext={handleNextPage}
        onSubmit={onSubmit}
      />
    </form>
  );
}
