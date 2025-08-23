import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar } from './filters/FilterBar';
import { TripGrid } from './TripGrid';

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

interface TripListProps {
  trips: Trip[];
  onDeleteTrip: (tripId: string) => Promise<boolean>;
  userRole: string | null;
  hasFreeTrip: boolean;
}

export const TripList = ({ trips, onDeleteTrip, userRole, hasFreeTrip }: TripListProps) => {
  const { t } = useTranslation('dashboard');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [activityFilter, setActivityFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [tripTypeFilter, setTripTypeFilter] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredTrips = trips.filter(trip => {
    if (locationFilter && trip.location) {
      if (!trip.location.toLowerCase().includes(locationFilter.toLowerCase())) {
        return false;
      }
    }

    if (dateFilter && trip.start_date) {
      const tripStartDate = new Date(trip.start_date);
      const filterDate = new Date(dateFilter);
      
      tripStartDate.setHours(0, 0, 0, 0);
      filterDate.setHours(0, 0, 0, 0);
      
      if (tripStartDate.getTime() !== filterDate.getTime()) {
        return false;
      }
    }

    if (activityFilter && trip.category) {
      if (trip.category !== activityFilter) {
        return false;
      }
    }

    if (tripTypeFilter && trip.trip_type) {
      if (trip.trip_type !== tripTypeFilter) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const clearFilters = () => {
    setLocationFilter('');
    setDateFilter(undefined);
    setActivityFilter('');
    setTripTypeFilter('');
    setIsFilterActive(false);
  };

  const applyFilters = () => {
    setIsFilterActive(
      !!locationFilter || !!dateFilter || !!activityFilter || !!tripTypeFilter
    );
    setIsFilterOpen(false);
  };

  // Get unique categories and locations for filter options
  const categories = Array.from(
    new Set(trips.filter(trip => trip.category).map(trip => trip.category))
  ).filter(Boolean) as string[];
  
  const locations = Array.from(
    new Set(trips.filter(trip => trip.location).map(trip => trip.location))
  ).filter(Boolean) as string[];
  
  const tripTypes = Array.from(
    new Set(trips.filter(trip => trip.trip_type).map(trip => trip.trip_type))
  ).filter(Boolean) as string[];

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-gray-600">{t('trip.empty.noneYet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar
        locationFilter={locationFilter}
        dateFilter={dateFilter}
        activityFilter={activityFilter}
        tripTypeFilter={tripTypeFilter}
        sortOrder={sortOrder}
        isFilterActive={isFilterActive}
        isFilterOpen={isFilterOpen}
        locations={locations}
        categories={categories}
        tripTypes={tripTypes}
        setLocationFilter={setLocationFilter}
        setDateFilter={setDateFilter}
        setActivityFilter={setActivityFilter}
        setTripTypeFilter={setTripTypeFilter}
        setSortOrder={setSortOrder}
        setIsFilterOpen={setIsFilterOpen}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
      />
      
      <TripGrid 
        trips={trips}
        filteredTrips={filteredTrips}
        onDeleteTrip={onDeleteTrip}
        clearFilters={clearFilters}
        userRole={userRole}
        hasFreeTrip={hasFreeTrip}
      />
    </div>
  );
};
