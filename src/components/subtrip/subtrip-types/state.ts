import { ActivityType, LocationCoordinates, LocationDetails, StepType, VehicleType } from './index';
import { DateRange } from 'react-day-picker';

export interface HeroState {
  location: string;
  coordinates: [number, number];
  isMobile: boolean;
  currentStep: StepType;
  selectedActivity: ActivityType | null;
  selectedTinderOptions: string[];
  selectedDate: Date | undefined;
  dateRange: DateRange | undefined;
  customActivityDialogOpen: boolean;
  customActivity: string;
  customActivities: string[];
  selectedTripInterests: string[];
  departureLocation: string;
  departureCoordinates: [number, number];
  transportMode: string | null;
  isElectricCar: boolean;
  isCarpool: boolean;
  isLocating: boolean;
  accommodation: string | null;
  adultCount: number;
  childCount: number;
  maxBudget: string;
  isCreatingTrip: boolean;
  showZapAnimation: boolean;
  zapAnimationType: 'ZAPTRIP' | 'ZAPOUT' | 'ZAPROAD';
  showAuthModal: boolean;
  showUpgradeModal: boolean;
  locationImage: string | null;
  isLoadingImage: boolean;
  locationDetails: LocationDetails | null;
  tinderLocation: string;
  tinderCoordinates: [number, number];
  minBudget: string;
  isTinderLocating: boolean;
  isCreatingTinderDate: boolean;
  selectedCurrency: string;
  currencySymbol: string;
  isCreatingFriendActivity: boolean;
  startLocation: string;
  startCoordinates: [number, number];
  intermediateLocations: LocationCoordinates[];
  endLocation: string;
  endCoordinates: [number, number];
  isStartLocating: boolean;
  isEndLocating: boolean;
  roadTripVehicleType: VehicleType;
  roadTripAdults: number;
  roadTripKids: number;
  hasPets: boolean | null;
  expandedCategory: string | null;
}

export interface HeroStateAction {
  type: string;
  payload?: any;
} 