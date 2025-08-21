import { TripCard } from './TripCard';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Trip {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string | null;
  coordinates: [number, number] | null;
  ai_content: string | null;
  trip_type?: string | null;
  category?: string | null;
  created_at: string;
}

interface TripGridProps {
  trips: Trip[];
  filteredTrips: Trip[];
  onDeleteTrip: (tripId: string) => Promise<boolean>;
  clearFilters: () => void;
  userRole: string | null;
  hasFreeTrip: boolean;
}

export const TripGrid = ({ trips, filteredTrips, onDeleteTrip, clearFilters, userRole, hasFreeTrip }: TripGridProps) => {
  const { t } = useTranslation('dashboard');

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('trip.empty.noneYet')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTrips.length > 0 ? (
        filteredTrips.map((trip) => (
          <TripCard 
            key={trip.id} 
            trip={trip} 
            onDelete={onDeleteTrip}
            userRole={userRole}
            hasFreeTrip={hasFreeTrip}
          />
        ))
      ) : (
        <div className="col-span-3 text-center py-8">
          <p className="text-gray-500">{t('trip.filter.noResults')}</p>
          <Button variant="link" onClick={clearFilters}>
            {t('clearFilters')}
          </Button>
        </div>
      )}
    </div>
  );
};
