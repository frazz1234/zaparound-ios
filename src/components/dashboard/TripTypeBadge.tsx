import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface TripTypeBadgeProps {
  tripType: string | null | undefined;
}

export const TripTypeBadge = ({ tripType }: TripTypeBadgeProps) => {
  const { t } = useTranslation('trip');

  if (!tripType) return null;

  const getBadgeStyle = () => {
    switch(tripType) {
      case 'ZapOut':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200';
      case 'ZapRoad':
        return 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200';
      case 'ZapTrip':
      default:
        return 'bg-sky-100 text-sky-800 border border-sky-200 hover:bg-sky-200';
    }
  };

  const getLabel = () => {
    switch(tripType) {
      case 'ZapOut':
        return 'ZapOut ';
      case 'ZapRoad':
        return 'ZapRoad';
      case 'ZapTrip':
      default:
        return 'ZapTrip';
    }
  };

  return (
    <Badge variant="outline" className={`${getBadgeStyle()} font-medium px-3 py-1`}>
      {getLabel()}
    </Badge>
  );
};
