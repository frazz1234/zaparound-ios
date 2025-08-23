import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Filter, Plane, Clock, MapPin, DollarSign, Luggage } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { airports } from '@/utils/airportData';

interface FlightFiltersProps {
  onFiltersChange: (filters: FlightFilters) => void;
}

export interface FlightFilters {
  airlines: string[];
  stops: 'any' | 'nonstop' | '1_or_fewer' | '2_or_fewer';
  bags: 'any' | 'included' | 'not_included';
  priceRange: [number, number];
  connectingAirports: string[];
  duration: [number, number]; // in hours
}

const popularAirlines = [
  { code: 'AC', name: 'Air Canada' },
  { code: 'WS', name: 'WestJet' },
  { code: 'AA', name: 'American Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'UA', name: 'United Airlines' },
];

const allAirlines = [
  ...popularAirlines,
  { code: 'BA', name: 'British Airways' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'EK', name: 'Emirates' },
  { code: 'EY', name: 'Etihad Airways' },
  { code: 'CX', name: 'Cathay Pacific' },
  { code: 'SQ', name: 'Singapore Airlines' },
];

const connectingAirports = airports.slice(0, 50).map(airport => ({
  code: airport.iata_code,
  name: `${airport.city} (${airport.iata_code})`
}));

export const FlightFilters: React.FC<FlightFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<FlightFilters>({
    airlines: [],
    stops: 'any',
    bags: 'any',
    priceRange: [0, 5000],
    connectingAirports: [],
    duration: [0, 24],
  });

  const [showAllAirlines, setShowAllAirlines] = useState(false);

  const updateFilters = (newFilters: Partial<FlightFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const toggleAirline = (airlineCode: string) => {
    const newAirlines = filters.airlines.includes(airlineCode)
      ? filters.airlines.filter(code => code !== airlineCode)
      : [...filters.airlines, airlineCode];
    updateFilters({ airlines: newAirlines });
  };

  const toggleConnectingAirport = (airportCode: string) => {
    const newAirports = filters.connectingAirports.includes(airportCode)
      ? filters.connectingAirports.filter(code => code !== airportCode)
      : [...filters.connectingAirports, airportCode];
    updateFilters({ connectingAirports: newAirports });
  };

  const clearAllFilters = () => {
    const clearedFilters: FlightFilters = {
      airlines: [],
      stops: 'any',
      bags: 'any',
      priceRange: [0, 5000],
      connectingAirports: [],
      duration: [0, 24],
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return filters.airlines.length > 0 ||
           filters.stops !== 'any' ||
           filters.bags !== 'any' ||
           filters.priceRange[0] > 0 ||
           filters.priceRange[1] < 5000 ||
           filters.connectingAirports.length > 0 ||
           filters.duration[0] > 0 ||
           filters.duration[1] < 24;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#61936f]" />
          <h3 className="font-semibold text-[#1d1d1e]">Filters</h3>
          {hasActiveFilters() && (
            <span className="bg-[#61936f] text-white text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-[#62626a] hover:text-[#1d1d1e]"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Airlines Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-[#61936f]" />
              <span>Airlines</span>
              {filters.airlines.length > 0 && (
                <span className="bg-[#61936f] text-white text-xs px-1.5 py-0.5 rounded-full">
                  {filters.airlines.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-3">
              <h4 className="font-medium">Airlines</h4>
              <div className="space-y-2">
                {popularAirlines.map((airline) => (
                  <div key={airline.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`airline-${airline.code}`}
                      checked={filters.airlines.includes(airline.code)}
                      onCheckedChange={() => toggleAirline(airline.code)}
                    />
                    <Label htmlFor={`airline-${airline.code}`} className="text-sm cursor-pointer">
                      {airline.name}
                    </Label>
                  </div>
                ))}
                
                {!showAllAirlines ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllAirlines(true)}
                    className="text-[#61936f] hover:text-[#1d1d1e] p-0 h-auto"
                  >
                    Show more airlines ({allAirlines.length - popularAirlines.length})
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Separator />
                    {allAirlines.slice(popularAirlines.length).map((airline) => (
                      <div key={airline.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`airline-${airline.code}`}
                          checked={filters.airlines.includes(airline.code)}
                          onCheckedChange={() => toggleAirline(airline.code)}
                        />
                        <Label htmlFor={`airline-${airline.code}`} className="text-sm cursor-pointer">
                          {airline.name}
                        </Label>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllAirlines(false)}
                      className="text-[#61936f] hover:text-[#1d1d1e] p-0 h-auto"
                    >
                      Show less
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Number of Stops Filter */}
        <Select value={filters.stops} onValueChange={(value: any) => updateFilters({ stops: value })}>
          <SelectTrigger className="w-40">
            <MapPin className="w-4 h-4 text-[#61936f] mr-2" />
            <SelectValue placeholder="Stops" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any stops</SelectItem>
            <SelectItem value="nonstop">Nonstop only</SelectItem>
            <SelectItem value="1_or_fewer">1 stop or fewer</SelectItem>
            <SelectItem value="2_or_fewer">2 stops or fewer</SelectItem>
          </SelectContent>
        </Select>

        {/* Bags Filter */}
        <Select value={filters.bags} onValueChange={(value: any) => updateFilters({ bags: value })}>
          <SelectTrigger className="w-40">
            <Luggage className="w-4 h-4 text-[#61936f] mr-2" />
            <SelectValue placeholder="Bags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any bags</SelectItem>
            <SelectItem value="included">Bags included</SelectItem>
            <SelectItem value="not_included">Bags not included</SelectItem>
          </SelectContent>
        </Select>

        {/* Price Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#61936f]" />
              <span>Price</span>
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) && (
                <span className="bg-[#61936f] text-white text-xs px-1.5 py-0.5 rounded-full">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium">Price Range</h4>
              <div className="space-y-2">
                <Label className="text-sm text-[#62626a]">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                  max={5000}
                  min={0}
                  step={50}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilters({ priceRange: [parseInt(e.target.value) || 0, filters.priceRange[1]] })}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilters({ priceRange: [filters.priceRange[0], parseInt(e.target.value) || 5000] })}
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Connecting Airports Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#61936f]" />
              <span>Airports</span>
              {filters.connectingAirports.length > 0 && (
                <span className="bg-[#61936f] text-white text-xs px-1.5 py-0.5 rounded-full">
                  {filters.connectingAirports.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-3">
              <h4 className="font-medium">Connecting Airports</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {connectingAirports.map((airport) => (
                  <div key={airport.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`airport-${airport.code}`}
                      checked={filters.connectingAirports.includes(airport.code)}
                      onCheckedChange={() => toggleConnectingAirport(airport.code)}
                    />
                    <Label htmlFor={`airport-${airport.code}`} className="text-sm cursor-pointer">
                      {airport.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Duration Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#61936f]" />
              <span>Duration</span>
              {(filters.duration[0] > 0 || filters.duration[1] < 24) && (
                <span className="bg-[#61936f] text-white text-xs px-1.5 py-0.5 rounded-full">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="font-medium">Duration Range</h4>
              <div className="space-y-2">
                <Label className="text-sm text-[#62626a]">
                  {filters.duration[0]}h - {filters.duration[1]}h
                </Label>
                <Slider
                  value={filters.duration}
                  onValueChange={(value) => updateFilters({ duration: value as [number, number] })}
                  max={24}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min hours"
                  value={filters.duration[0]}
                  onChange={(e) => updateFilters({ duration: [parseInt(e.target.value) || 0, filters.duration[1]] })}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max hours"
                  value={filters.duration[1]}
                  onChange={(e) => updateFilters({ duration: [filters.duration[0], parseInt(e.target.value) || 24] })}
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}; 