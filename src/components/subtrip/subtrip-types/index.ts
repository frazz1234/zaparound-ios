export type ActivityType = 'plan-trip' | 'tinder-date' | 'friends' | 'roadtrip';
export type StepType = 
  | 'activity'
  | 'location-picker'
  | 'tinder-options'
  | 'calendar'
  | 'trip-interests'
  | 'travel-logistics'
  | 'accommodation'
  | 'travel-details'
  | 'road-trip-locations'
  | 'road-trip-vehicle'
  | 'road-trip-interests';

export type VehicleType = 'car' | 'electric-car' | 'bike' | 'bicycle' | 'rv' | null;

export interface HeroProps {
  session: any;
  onTripCreated?: () => void;
}

export interface LocationCoordinates {
  name: string;
  coordinates: [number, number];
}

export interface Currency {
  value: string;
  label: string;
  symbol: string;
}

export interface LocationDetails {
  name: string;
  country: string;
  description: string;
}

export interface TripInterestItem {
  id: string;
  label: string;
  icon: any;
}

export interface TripInterestCategory {
  category: string;
  items: TripInterestItem[];
}

export interface AnimationText {
  prefix: string;
  main: string;
} 