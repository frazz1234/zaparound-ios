import { useState } from "react";
import { TripType } from "../../TripTypeSelector";
import { TripTypeSelectionPage } from "../../form-pages/TripTypeSelectionPage";
import { ZapRoadSetupPage } from "./ZapRoadSetupPage";
import { ZapRoadCitySelectionPage } from "./ZapRoadCitySelectionPage";
import { ZapRoadDetailsPage } from "./ZapRoadDetailsPage";
import { useZapRoadForm } from "@/hooks/useZapRoadForm";

interface ZapRoadFormContentProps {
  currentPage: number;
  title: string;
  description: string;
  location: string;
  startDate?: Date;
  endDate?: Date;
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
  onSubmit: (e: React.FormEvent, formData?: any) => void;
}

export function ZapRoadFormContent({
  currentPage,
  title,
  description,
  location,
  startDate,
  endDate,
  adults,
  kids,
  isLoading,
  tripType,
  onTitleChange,
  onDescriptionChange,
  onLocationChange,
  onStartDateChange,
  onEndDateChange,
  onAdultsChange,
  onKidsChange,
  onTripTypeChange,
  onNext,
  onBack,
  onCancel,
  onSubmit
}: ZapRoadFormContentProps) {
  // Use the custom hook to manage ZapRoad form state
  const zapRoadForm = useZapRoadForm(onDescriptionChange, onLocationChange);

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("ZapRoadFormContent - Starting form submission");
    
    // Get the complete form data from prepareFormSubmission
    const formData = zapRoadForm.prepareFormSubmission(e, title);
    
    console.log("ZapRoadFormContent - Form data prepared:", JSON.stringify(formData, null, 2));
    
    // Pass the form data to the parent component
    onSubmit(e, formData);
  };

  // Render different pages based on currentPage
  switch (currentPage) {
    case 0:
      return (
        <TripTypeSelectionPage
          tripType={tripType}
          onTripTypeChange={onTripTypeChange}
          onNext={onNext}
          onCancel={onCancel}
        />
      );
    case 1:
      return (
        <ZapRoadSetupPage
          title={title}
          startDate={startDate}
          endDate={endDate}
          adults={adults}
          kids={kids}
          isLoading={isLoading}
          onTitleChange={onTitleChange}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onAdultsChange={onAdultsChange}
          onKidsChange={onKidsChange}
          onBack={onBack}
          onSubmit={onNext} // Use onNext here to navigate to the next page
        />
      );
    case 2:
      return (
        <ZapRoadCitySelectionPage
          startingCity={zapRoadForm.startingCity}
          stopoverCities={zapRoadForm.stopoverCities}
          endCity={zapRoadForm.endCity}
          startingCityCoordinates={zapRoadForm.startingCityCoordinates}
          endCityCoordinates={zapRoadForm.endCityCoordinates}
          isLoading={false}
          onStartingCityChange={zapRoadForm.handleStartingCityChange}
          onAddStopoverCity={zapRoadForm.handleAddStopoverCity}
          onRemoveStopoverCity={zapRoadForm.handleRemoveStopoverCity}
          onEndCityChange={zapRoadForm.handleEndCityChange}
          onBack={onBack}
          onSubmit={onNext} // Use onNext here to navigate to the next page
        />
      );
    case 3:
      return (
        <ZapRoadDetailsPage
          numberOfPeople={zapRoadForm.numberOfPeople}
          hasElectricCar={zapRoadForm.hasElectricCar}
          specialRequirements={zapRoadForm.specialRequirements}
          isLoading={isLoading}
          onNumberOfPeopleChange={zapRoadForm.handleNumberOfPeopleChange}
          onHasElectricCarChange={zapRoadForm.handleHasElectricCarChange}
          onSpecialRequirementsChange={zapRoadForm.handleSpecialRequirementsChange}
          onBack={onBack}
          onSubmit={handleFinalSubmit} // Use the final submit handler that prepares the form and calls onSubmit
        />
      );
    default:
      return null;
  }
}
