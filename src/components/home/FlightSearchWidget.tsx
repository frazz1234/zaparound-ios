import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Calendar as CalendarIcon, 
  Search, 
  Users,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AirportSelector from '@/components/booking/AirportSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlightSearchWidgetProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const FlightSearchWidget: React.FC<FlightSearchWidgetProps> = ({ 
  className,
  variant = 'full' 
}) => {
  const { t, i18n } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  
  // Search state
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengerCounts, setPassengerCounts] = useState({
    adults: 1,
    children: 0,
    infantsInSeat: 0,
    infantsOnLap: 0
  });
  const [cabinClass, setCabinClass] = useState('economy');
  
  // Popover state
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);
  
  const totalPassengers = passengerCounts.adults + passengerCounts.children + 
    passengerCounts.infantsInSeat + passengerCounts.infantsOnLap;

  const handleSearch = () => {
    // Validate required fields
    if (!origin || !destination || !departureDate || !cabinClass) {
      return;
    }

    // Create search parameters
    const searchParams = new URLSearchParams({
      origin,
      destination,
      departureDate: departureDate.toISOString().split('T')[0],
      tripType,
      adults: passengerCounts.adults.toString(),
      children: passengerCounts.children.toString(),
      infantsInSeat: passengerCounts.infantsInSeat.toString(),
      infantsOnLap: passengerCounts.infantsOnLap.toString(),
      cabinClass
    });

    if (tripType === 'roundtrip' && returnDate) {
      searchParams.append('returnDate', returnDate.toISOString().split('T')[0]);
    }

    // Navigate to internal booking page with search parameters
    navigate(`/${i18n.language}/booking/internal-flights?${searchParams.toString()}`);
  };

  const handleDepartureDateSelect = (date: Date | undefined) => {
    setDepartureDate(date);
    if (date) {
      setIsDepartureDateOpen(false);
      if (tripType === 'roundtrip') {
        setIsReturnDateOpen(true);
      }
    }
  };

  const handleReturnDateSelect = (date: Date | undefined) => {
    setReturnDate(date);
    if (date) {
      setIsReturnDateOpen(false);
    }
  };

  const isSearchValid = origin && destination && departureDate && cabinClass;

  if (variant === 'compact') {
    return (
      <Card className={cn("bg-white/95 backdrop-blur-sm border-0 shadow-xl", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Trip Type */}
            <ToggleGroup 
              type="single" 
              value={tripType} 
              onValueChange={(value) => value && setTripType(value as 'roundtrip' | 'oneway')}
              className="justify-start"
            >
              <ToggleGroupItem 
                value="roundtrip" 
                className="px-3 py-1.5 text-sm data-[state=on]:text-[#61936f] data-[state=on]:border-[#61936f] data-[state=on]:bg-[#61936f]/5"
              >
                Round Trip
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="oneway" 
                className="px-3 py-1.5 text-sm data-[state=on]:text-[#61936f] data-[state=on]:border-[#61936f] data-[state=on]:bg-[#61936f]/5"
              >
                One Way
              </ToggleGroupItem>
            </ToggleGroup>

            {/* From */}
            <div className="flex-1 min-w-[200px]">
              <AirportSelector
                value={origin}
                onChange={setOrigin}
                placeholder="From"
                className="w-full"
              />
            </div>

            {/* To */}
            <div className="flex-1 min-w-[200px]">
              <AirportSelector
                value={destination}
                onChange={setDestination}
                placeholder="To"
                className="w-full"
              />
            </div>

            {/* Departure Date */}
            <div className="min-w-[200px]">
              <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !departureDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {departureDate ? format(departureDate, "MMM dd") : "Departure"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={handleDepartureDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Return Date - Only for roundtrip */}
            {tripType === 'roundtrip' && (
              <div className="min-w-[200px]">
                <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !returnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "MMM dd") : "Return"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={handleReturnDateSelect}
                      disabled={(date) => 
                        date < new Date() || 
                        (departureDate && date <= departureDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!isSearchValid}
              className="bg-[#61936f] hover:bg-[#4a7c59] text-white px-8 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Flights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-white/95 backdrop-blur-sm border-0 shadow-xl", className)}>
      <CardContent className="p-8">


        {/* Trip Type */}
        <div className="flex justify-center mb-6">
          <ToggleGroup 
            type="single" 
            value={tripType} 
            onValueChange={(value) => value && setTripType(value as 'roundtrip' | 'oneway')}
            className="justify-center"
          >
            <ToggleGroupItem 
              value="roundtrip" 
              className="px-4 py-2 text-sm data-[state=on]:text-[#61936f] data-[state=on]:border-[#61936f] data-[state=on]:bg-[#61936f]/5"
            >
              Round Trip
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="oneway" 
              className="px-4 py-2 text-sm data-[state=on]:text-[#61936f] data-[state=on]:border-[#61936f] data-[state=on]:bg-[#61936f]/5"
            >
              One Way
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* From */}
          <div>
            <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">From</label>
            <AirportSelector
              value={origin}
              onChange={setOrigin}
              placeholder="Departure airport"
              className="w-full"
            />
          </div>

          {/* To */}
          <div>
            <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">To</label>
            <AirportSelector
              value={destination}
              onChange={setDestination}
              placeholder="Arrival airport"
              className="w-full"
            />
          </div>

          {/* Departure Date */}
          <div>
            <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">Departure</label>
            <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !departureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {departureDate ? format(departureDate, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={handleDepartureDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Return Date - Only for roundtrip */}
          {tripType === 'roundtrip' ? (
            <div>
              <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">Return</label>
              <Popover open={isReturnDateOpen} onOpenChange={setIsReturnDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={handleReturnDateSelect}
                    disabled={(date) => 
                      date < new Date() || 
                      (departureDate && date <= departureDate)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">Passengers</label>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Users className="mr-2 h-4 w-4" />
                {totalPassengers} {totalPassengers === 1 ? 'passenger' : 'passengers'}
              </Button>
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Passengers - Only show for roundtrip */}
          {tripType === 'roundtrip' && (
            <div>
              <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">Passengers</label>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Users className="mr-2 h-4 w-4" />
                {totalPassengers} {totalPassengers === 1 ? 'passenger' : 'passengers'}
              </Button>
            </div>
          )}

          {/* Cabin Class */}
          <div>
            <label className="text-sm font-medium text-[#1d1d1e] mb-2 block">Cabin Class</label>
            <Select value={cabinClass} onValueChange={setCabinClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="premium_economy">Premium Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="first">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              disabled={!isSearchValid}
              className="w-full bg-[#61936f] hover:bg-[#4a7c59] text-white py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Flights
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-[#62626a]">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>Search by airport code or city</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Flexible dates available</span>
          </div>
          <div className="flex items-center gap-1">
            <Plane className="w-4 h-4" />
            <span>Compare prices instantly</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightSearchWidget; 