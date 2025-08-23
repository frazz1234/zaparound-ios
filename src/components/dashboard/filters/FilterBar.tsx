
import { FilterBadges } from './FilterBadges';
import { TripFilters } from './TripFilters';
import { SortButton } from './SortButton';

interface FilterBarProps {
  locationFilter: string;
  dateFilter: Date | undefined;
  activityFilter: string;
  tripTypeFilter: string;
  sortOrder: 'newest' | 'oldest';
  isFilterActive: boolean;
  isFilterOpen: boolean;
  locations: string[];
  categories: string[];
  tripTypes: string[];
  setLocationFilter: (location: string) => void;
  setDateFilter: (date: Date | undefined) => void;
  setActivityFilter: (activity: string) => void;
  setTripTypeFilter: (tripType: string) => void;
  setSortOrder: (order: 'newest' | 'oldest') => void;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}

export const FilterBar = ({
  locationFilter,
  dateFilter,
  activityFilter,
  tripTypeFilter,
  sortOrder,
  isFilterActive,
  isFilterOpen,
  locations,
  categories,
  tripTypes,
  setLocationFilter,
  setDateFilter,
  setActivityFilter,
  setTripTypeFilter,
  setSortOrder,
  setIsFilterOpen,
  applyFilters,
  clearFilters
}: FilterBarProps) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <FilterBadges
          isFilterActive={isFilterActive}
          dateFilter={dateFilter}
          locationFilter={locationFilter}
          activityFilter={activityFilter}
          tripTypeFilter={tripTypeFilter}
          clearFilters={clearFilters}
          setDateFilter={setDateFilter}
          setLocationFilter={setLocationFilter}
          setActivityFilter={setActivityFilter}
          setTripTypeFilter={setTripTypeFilter}
        />
        
        <div className="flex gap-2 self-end sm:self-auto">
          <TripFilters
            locationFilter={locationFilter}
            dateFilter={dateFilter}
            activityFilter={activityFilter}
            tripTypeFilter={tripTypeFilter}
            locations={locations}
            categories={categories}
            tripTypes={tripTypes}
            setLocationFilter={setLocationFilter}
            setDateFilter={setDateFilter}
            setActivityFilter={setActivityFilter}
            setTripTypeFilter={setTripTypeFilter}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
          />
          
          <SortButton
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </div>
      </div>
    </div>
  );
}
