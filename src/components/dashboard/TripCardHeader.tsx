import { MapPin, Calendar, Plane, Car, Map, Compass, Route, Navigation, PlaneTakeoff, CableCar } from 'lucide-react';
import { TripTypeBadge } from './TripTypeBadge';

interface TripCardHeaderProps {
  title: string;
  tripType: string | null | undefined;
}

export const TripCardHeader = ({ title, tripType }: TripCardHeaderProps) => {
  const getBgColor = () => {
    switch(tripType) {
      case 'ZapOut':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
      case 'ZapRoad':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'ZapTrip':
      default:
        return 'bg-gradient-to-r from-sky-500 to-sky-600';
    }
  };
  
  const getIcon = () => {
    switch(tripType) {
      case 'ZapOut':
        return <CableCar className="h-5 w-5 mr-2 text-white/90" />;
      case 'ZapRoad':
        return <Car className="h-5 w-5 mr-2 text-white/90" />;
      case 'ZapTrip':
      default:
        return <PlaneTakeoff className="h-5 w-5 mr-2 text-white/90" />;
    }
  };

  return (
    <div className={`${getBgColor()} px-5 py-3 text-primary-foreground flex justify-between items-center shadow-sm rounded-t-lg`}>
      <div className="flex items-center space-x-1 max-w-[70%]">
        {getIcon()}
        <h2 className="text-lg font-semibold truncate">{title}</h2>
      </div>
      {tripType && <TripTypeBadge tripType={tripType} />}
    </div>
  );
};
