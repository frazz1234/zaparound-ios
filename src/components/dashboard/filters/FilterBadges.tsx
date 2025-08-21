import { Calendar, Map, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface FilterBadgesProps {
  isFilterActive: boolean;
  dateFilter: Date | undefined;
  locationFilter: string;
  activityFilter: string;
  tripTypeFilter: string;
  clearFilters: () => void;
  setDateFilter: (date: Date | undefined) => void;
  setLocationFilter: (location: string) => void;
  setActivityFilter: (activity: string) => void;
  setTripTypeFilter: (tripType: string) => void;
}

export const FilterBadges = ({
  isFilterActive,
  dateFilter,
  locationFilter,
  activityFilter,
  tripTypeFilter,
  clearFilters,
  setDateFilter,
  setLocationFilter,
  setActivityFilter,
  setTripTypeFilter
}: FilterBadgesProps) => {
  const { t } = useTranslation('dashboard');

  if (!isFilterActive) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={clearFilters}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4" />
        {t('clearFilters')}
      </Button>
      
      {dateFilter && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(dateFilter, 'MMM dd, yyyy')}
          <button onClick={() => setDateFilter(undefined)} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {locationFilter && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Map className="h-3 w-3" />
          {locationFilter}
          <button onClick={() => setLocationFilter('')} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {activityFilter && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {activityFilter}
          <button onClick={() => setActivityFilter('')} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      {tripTypeFilter && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {tripTypeFilter}
          <button onClick={() => setTripTypeFilter('')} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
};
