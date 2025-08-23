export interface TripFormData {
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  startDate?: Date;
  endDate?: Date;
  category?: string;
  budget?: string;
  minBudget?: string;
  maxBudget?: string;
  currency?: string;
  transportationMode?: string;
  transportationDetails?: string;
  accommodationType?: string;
  accommodationDetails?: string;
  notes?: string;
  adults: number;
  kids: number;
  tripType: 'ZapTrip' | 'ZapOut' | 'ZapRoad';
  
  // ZapTrip specific fields
  interests?: string[];
  hasPets?: boolean;
  departureLocation?: string;
  departureCoordinates?: [number, number];
  
  // ZapOut specific fields
  activityTimes?: string[];
  includeLunch?: boolean;
  lunchOption?: string;
  activityTypes?: string[];
  includeBudgetPerPerson?: boolean;
  budgetPerPerson?: string;
  additionalNeeds?: string;
  requestedActivities?: string[];
  
  // ZapRoad specific fields
  duration?: number;
  startingCity?: string;
  startingCityCoordinates?: [number, number];
  stopoverCities?: { name: string; coordinates: [number, number] }[];
  endCity?: string;
  endCityCoordinates?: [number, number];
  numberOfPeople?: number;
  hasElectricCar?: boolean;
  specialRequirements?: string;
  carType?: string;
}

// Props interfaces for the ZapOut form components
export interface ActivityTimeSelectorProps {
  activityTimes: string[];
  onActivityTimesChange: (times: string[]) => void;
}

export interface LunchSelectorProps {
  includeLunch: boolean;
  lunchOption: string;
  onIncludeLunchChange: (value: boolean) => void;
  onLunchOptionChange: (value: string) => void;
}

export interface ActivityTypeSelectorProps {
  activityTypes: string[];
  onActivityTypesChange: (types: string[]) => void;
}

export interface BudgetPerPersonInputProps {
  includeBudgetPerPerson: boolean;
  budgetPerPerson: string;
  onIncludeBudgetPerPersonChange: (value: boolean) => void;
  onBudgetPerPersonChange: (value: string) => void;
}

export interface NavigationButtonsProps {
  activityTimes: string[];
  activityTypes: string[];
  includeBudgetPerPerson: boolean;
  budgetPerPerson: string;
  onBack: () => void;
  onNext: () => void;
  currentPage?: number;
}

export interface AdditionalNeedsPageProps {
  additionalNeeds: string;
  onAdditionalNeedsChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export interface ZapOutBasicInfoPageProps {
  title: string;
  location: string;
  coordinates: [number, number];
  onTitleChange: (value: string) => void;
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  onBack: () => void;
  onNext: () => void;
}

export interface ZapOutActivityPageProps {
  activityTimes: string[];
  includeLunch: boolean;
  lunchOption: string;
  activityTypes: string[];
  includeBudgetPerPerson: boolean;
  budgetPerPerson: string;
  onActivityTimesChange: (times: string[]) => void;
  onIncludeLunchChange: (value: boolean) => void;
  onLunchOptionChange: (value: string) => void;
  onActivityTypesChange: (types: string[]) => void;
  onIncludeBudgetPerPersonChange: (value: boolean) => void;
  onBudgetPerPersonChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export interface PersonDatePageProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  adults: number;
  kids: number;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onAdultsChange: (value: number) => void;
  onKidsChange: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
}

// Adding props interface for ZapRoad third page
export interface ZapRoadDetailsPageProps {
  numberOfPeople: number;
  hasElectricCar: boolean;
  specialRequirements: string;
  isLoading: boolean;
  onNumberOfPeopleChange: (value: number) => void;
  onHasElectricCarChange: (value: boolean) => void;
  onSpecialRequirementsChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface TransportationDetails {
  mode?: string;
  details?: string;
}

export interface AccommodationDetails {
  type?: string;
  details?: string;
}

export interface GeoPosition {
  name: string;
  type: string;
  coordinates: [number, number];
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  location: string | null;
  coordinates: string | null;
  geoposition: GeoPosition[] | null;
  ai_content: string | null;
  trip_type?: string | null;
  category: string | null;
  budget: number | null;
  transportation_details: TransportationDetails;
  accommodation_details: AccommodationDetails;
  user_id: string;
  is_free_trip?: boolean;
}
