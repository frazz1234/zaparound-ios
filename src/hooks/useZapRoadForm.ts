import { useState } from "react";
import { useTranslation } from 'react-i18next';

interface ZapRoadFormState {
  startingCity: string;
  startingCityCoordinates: [number, number];
  stopoverCities: { name: string; coordinates: [number, number] }[];
  endCity: string;
  endCityCoordinates: [number, number];
  numberOfPeople: number;
  hasElectricCar: boolean;
  specialRequirements: string;
}

export function useZapRoadForm(onDescriptionChange: (value: string) => void, onLocationChange: (location: string, coordinates: [number, number]) => void) {
  const { t } = useTranslation('common');
  const [formState, setFormState] = useState<ZapRoadFormState>({
    startingCity: "",
    startingCityCoordinates: [0, 0],
    stopoverCities: [],
    endCity: "",
    endCityCoordinates: [0, 0],
    numberOfPeople: 1,
    hasElectricCar: false,
    specialRequirements: "",
  });

  const handleStartingCityChange = (city: string, coordinates: [number, number]) => {
    setFormState(prev => ({
      ...prev,
      startingCity: city,
      startingCityCoordinates: coordinates
    }));
  };

  const handleAddStopoverCity = (city: string, coordinates: [number, number]) => {
    setFormState(prev => ({
      ...prev,
      stopoverCities: [...prev.stopoverCities, { name: city, coordinates }]
    }));
  };

  const handleRemoveStopoverCity = (index: number) => {
    setFormState(prev => {
      const updatedStopoverCities = [...prev.stopoverCities];
      updatedStopoverCities.splice(index, 1);
      return {
        ...prev,
        stopoverCities: updatedStopoverCities
      };
    });
  };

  const handleEndCityChange = (city: string, coordinates: [number, number]) => {
    setFormState(prev => ({
      ...prev,
      endCity: city,
      endCityCoordinates: coordinates
    }));
  };

  const handleNumberOfPeopleChange = (value: number) => {
    setFormState(prev => ({
      ...prev,
      numberOfPeople: value
    }));
  };

  const handleHasElectricCarChange = (value: boolean) => {
    setFormState(prev => ({
      ...prev,
      hasElectricCar: value
    }));
  };

  const handleSpecialRequirementsChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      specialRequirements: value
    }));
  };

  const createRoadTripDescription = (title: string) => {
    const { startingCity, endCity, stopoverCities, numberOfPeople, hasElectricCar, specialRequirements } = formState;
    
    const roadTripDescription = `
      ${title} - A road trip from ${startingCity} to ${endCity}
      ${stopoverCities.length > 0 ? `With stops at: ${stopoverCities.map(city => city.name).join(', ')}` : ''}
      Number of people: ${numberOfPeople}
      ${hasElectricCar ? 'Using an electric car' : ''}
      ${specialRequirements ? `Special requirements: ${specialRequirements}` : ''}
    `.trim();
    
    return roadTripDescription;
  };

  const prepareFormSubmission = (e: React.FormEvent, title: string) => {
    e.preventDefault();
    
    console.log("useZapRoadForm - Current form state:", JSON.stringify(formState, null, 2));
    
    // Update the description with the road trip details
    const roadTripDescription = createRoadTripDescription(title);
    onDescriptionChange(roadTripDescription);
    
    // Set trip starting location if not already set
    if (formState.startingCity) {
      onLocationChange(formState.startingCity, formState.startingCityCoordinates);
    }

    // Return the complete form state for submission
    const formData = {
      title,
      description: roadTripDescription,
      location: formState.startingCity,
      coordinates: formState.startingCityCoordinates,
      // ZapRoad specific fields
      startingCity: formState.startingCity,
      startingCityCoordinates: formState.startingCityCoordinates,
      stopoverCities: formState.stopoverCities,
      endCity: formState.endCity,
      endCityCoordinates: formState.endCityCoordinates,
      numberOfPeople: formState.numberOfPeople,
      hasElectricCar: formState.hasElectricCar,
      specialRequirements: formState.specialRequirements
    };

    console.log("useZapRoadForm - Prepared form data:", JSON.stringify(formData, null, 2));
    return formData;
  };

  return {
    ...formState,
    handleStartingCityChange,
    handleAddStopoverCity,
    handleRemoveStopoverCity,
    handleEndCityChange,
    handleNumberOfPeopleChange,
    handleHasElectricCarChange,
    handleSpecialRequirementsChange,
    prepareFormSubmission
  };
}
