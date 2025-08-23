import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plane, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Airport, searchAirports, getPopularAirports } from '@/utils/airportData';

interface AirportSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AirportSelector: React.FC<AirportSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select airport',
  className,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [popularAirports, setPopularAirports] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load popular airports on mount
  useEffect(() => {
    setPopularAirports(getPopularAirports());
  }, []);

  // Set selected airport when value changes
  useEffect(() => {
    if (value) {
      const airport = searchAirports(value).find(a => a.iata_code === value);
      setSelectedAirport(airport || null);
    } else {
      setSelectedAirport(null);
    }
  }, [value]);

  // Debounced search for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        const results = searchAirports(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    onChange(airport.iata_code);
    setOpen(false);
    setSearchQuery('');
  };



  const formatAirportSubtitle = (airport: Airport) => {
    return `${airport.city}, ${airport.country}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedAirport && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedAirport ? (
            <div className="flex items-center gap-2 truncate">
              <Plane className="h-4 w-4 text-[#61936f]" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedAirport.iata_code}</span>
                <span className="text-xs text-[#62626a] truncate">
                  {selectedAirport.city}, {selectedAirport.country}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-[#62626a]" />
              <span>{placeholder}</span>
            </div>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              ref={inputRef}
              placeholder="Search airports, cities, or countries..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              <div className="p-4 text-center">
                <Plane className="mx-auto h-8 w-8 text-[#62626a] mb-2" />
                <p className="text-sm text-[#62626a]">No airports found</p>
                <p className="text-xs text-[#62626a] mt-1">
                  Try searching by airport code, city, or country
                </p>
              </div>
            </CommandEmpty>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <CommandGroup heading="Search Results">
                {searchResults.map((airport) => (
                  <CommandItem
                    key={airport.iata_code}
                    value={`${airport.iata_code} ${airport.city} ${airport.name} ${airport.country}`}
                    onSelect={() => handleSelect(airport)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#f8f9fa]"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-[#61936f] rounded-full text-white text-xs font-bold">
                      {airport.iata_code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1d1d1e] truncate">
                        {airport.name}
                      </div>
                      <div className="text-sm text-[#62626a] truncate">
                        {formatAirportSubtitle(airport)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {airport.type}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Popular Airports */}
            {searchQuery.length === 0 && (
              <CommandGroup heading="Popular Airports">
                {popularAirports.map((airport) => (
                  <CommandItem
                    key={airport.iata_code}
                    value={airport.iata_code}
                    onSelect={() => handleSelect(airport)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#f8f9fa]"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-[#61936f] rounded-full text-white text-xs font-bold">
                      {airport.iata_code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1d1d1e] truncate">
                        {airport.name}
                      </div>
                      <div className="text-sm text-[#62626a] truncate">
                        {formatAirportSubtitle(airport)}
                      </div>
                    </div>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Quick Actions */}
            {searchQuery.length === 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <div className="text-xs text-[#62626a] mb-2">Quick Tips:</div>
                  <div className="space-y-1 text-xs text-[#62626a]">
                    <div>• Search by airport code (e.g., "JFK", "LHR", "YUL")</div>
                    <div>• Search by city name (e.g., "Montreal", "New York", "London")</div>
                    <div>• Search by airport name (e.g., "Heathrow", "Trudeau")</div>
                    <div>• Search by country (e.g., "Canada", "United States")</div>
                  </div>
                </div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AirportSelector; 