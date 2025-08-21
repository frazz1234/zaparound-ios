import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface TripFiltersProps {
  locationFilter: string;
  dateFilter: Date | undefined;
  activityFilter: string;
  tripTypeFilter: string;
  locations: string[];
  categories: string[];
  tripTypes: string[];
  setLocationFilter: (location: string) => void;
  setDateFilter: (date: Date | undefined) => void;
  setActivityFilter: (activity: string) => void;
  setTripTypeFilter: (tripType: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}

export const TripFilters = ({
  locationFilter,
  dateFilter,
  activityFilter,
  tripTypeFilter,
  locations,
  categories,
  tripTypes,
  setLocationFilter,
  setDateFilter,
  setActivityFilter,
  setTripTypeFilter,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  clearFilters
}: TripFiltersProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Filter className="h-4 w-4" />
          {t('filter.apply')}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[calc(100vw-2rem)] md:w-80 p-4 bg-white shadow-lg rounded-md border z-50" 
        align="end"
        sideOffset={8}
      >
        <div className="space-y-4">
          <h3 className="font-medium text-sm">{t('filter.apply')}</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">
              {t('filter.location')}
            </label>
            <Select 
              value={locationFilter} 
              onValueChange={setLocationFilter}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('filter.allLocations')} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[60]">
                <SelectItem value="">{t('filter.allLocations')}</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">
              {t('filter.date')}
            </label>
            <div className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 text-xs justify-start text-left font-normal ${!dateFilter ? 'text-muted-foreground' : ''}`}
                  >
                    {dateFilter ? dateFilter.toLocaleDateString() : t('filter.date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[70]" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dateFilter && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 mt-1 self-end" 
                  onClick={() => setDateFilter(undefined)}
                >
                  {t('filter.clear')}
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">
              {t('filter.activity')}
            </label>
            <Select 
              value={activityFilter} 
              onValueChange={setActivityFilter}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('filter.allCategories')} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[60]">
                <SelectItem value="">{t('filter.allCategories')}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">
              {t('filter.tripType')}
            </label>
            <Select 
              value={tripTypeFilter} 
              onValueChange={setTripTypeFilter}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('filter.allTripTypes')} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[60]">
                <SelectItem value="">{t('filter.allTripTypes')}</SelectItem>
                {tripTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="text-xs h-8 flex-1"
            >
              {t('filter.clear')}
            </Button>
            <Button 
              onClick={applyFilters} 
              className="text-xs h-8 flex-1"
            >
              {t('filter.apply')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
