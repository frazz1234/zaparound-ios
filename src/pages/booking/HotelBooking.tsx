import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Hotel, Star, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { LocationSearch } from "@/components/trips/LocationSearch";

interface HotelSearchParams {
  location: string;
  coordinates: [number, number];
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
}

interface HotelOffer {
  id: string;
  hotel: {
    name: string;
    rating: number;
    address: {
      city: string;
      country: string;
    };
  };
  room_types: Array<{
    name: string;
    description: string;
  }>;
  total_amount: string;
  total_currency: string;
}

interface HotelSearchResults {
  hotels: HotelOffer[];
}

export function HotelBooking() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<HotelOffer[]>([]);
  const [userProfile, setUserProfile] = useState<{ email: string; phone?: string } | null>(null);
  const [searchParams, setSearchParams] = useState<HotelSearchParams>({
    location: '',
    coordinates: [0, 0],
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
    guests: 1,
    rooms: 1,
  });

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user email from auth
        const email = user.email || '';
        
        // Try to get phone from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();
        
        setUserProfile({
          email,
          phone: profile?.phone || ''
        });
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      
      // Validate inputs
      if (!searchParams.location || !searchParams.coordinates[0] || !searchParams.coordinates[1]) {
        toast({
          title: "Missing Location",
          description: "Please select a valid location",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('duffel-booking-hotel-search', {
        body: {
          location: searchParams.location,
          coordinates: searchParams.coordinates,
          checkIn: format(searchParams.checkIn, 'yyyy-MM-dd'),
          checkOut: format(searchParams.checkOut, 'yyyy-MM-dd'),
          guests: searchParams.guests,
          rooms: searchParams.rooms,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Check if we got an error response
      if (data?.error) {
        if (data.error === 'Feature not enabled') {
          toast({
            title: "Feature Not Available",
            description: data.details || "Hotel booking is currently being set up. Please try again later or contact support for more information.",
            variant: "destructive",
          });
        } else if (data.error === 'No hotels found') {
          toast({
            title: "No Hotels Found",
            description: "No hotels were found for your search criteria. Please try a different location or dates.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.details || "Failed to search hotels. Please try again later.",
            variant: "destructive",
          });
        }
        return;
      }

      const results = data as HotelSearchResults;
      if (!results.hotels || results.hotels.length === 0) {
        toast({
          title: "No Hotels Found",
          description: "No hotels were found for your search criteria. Please try a different location or dates.",
          variant: "destructive",
        });
        return;
      }

      setSearchResults(results.hotels);
    } catch (error) {
      console.error('Error searching hotels:', error);
      
      // Check for specific error messages
      const errorMessage = error.message || '';
      if (errorMessage.includes('not enabled for your account')) {
        toast({
          title: "Feature Not Available",
          description: "Hotel booking is currently being set up. Please try again later or contact support for more information.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to search hotels. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (location: string, coordinates: [number, number]) => {
    setSearchParams(prev => ({
      ...prev,
      location,
      coordinates
    }));
  };

  const handleLocationSelect = (location: string, coordinates: [number, number]) => {
    setSearchParams(prev => ({
      ...prev,
      location,
      coordinates
    }));
  };

  const handleBooking = async (offerId: string) => {
    try {
      setIsLoading(true);
      
      // Check if we have user profile data
      if (!userProfile?.email) {
        toast({
          title: "User Information Required",
          description: "Please make sure you're logged in to book a hotel.",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('duffel-booking-hotel', {
        body: {
          offerId,
          guests: searchParams.guests,
          contact: {
            email: userProfile.email,
            phone: userProfile.phone || '+1234567890', // Fallback if no phone
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hotel booking confirmed!",
      });

      // Redirect to bookings page
      navigate(`/${i18n.language}/bookings`);
    } catch (error) {
      console.error('Error booking hotel:', error);
      toast({
        title: "Error",
        description: "Failed to book hotel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Hotels</h1>
          <p className="text-gray-600">Find and book the perfect hotel for your stay</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <LocationSearch
                value={searchParams.location}
                onChange={handleLocationChange}
                onSelect={handleLocationSelect}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !searchParams.checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchParams.checkIn ? (
                      format(searchParams.checkIn, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchParams.checkIn}
                    onSelect={(date) => date && setSearchParams({ ...searchParams, checkIn: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Check-out Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !searchParams.checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchParams.checkOut ? (
                      format(searchParams.checkOut, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchParams.checkOut}
                    onSelect={(date) => date && setSearchParams({ ...searchParams, checkOut: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Guests & Rooms</label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={searchParams.guests.toString()}
                  onValueChange={(value) => setSearchParams({ ...searchParams, guests: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Guests" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={searchParams.rooms.toString()}
                  onValueChange={(value) => setSearchParams({ ...searchParams, rooms: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Room' : 'Rooms'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              className="w-full bg-[#72ba87] hover:bg-[#61936f] text-white"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </div>
              ) : (
                <div className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Search Hotels
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Results section */}
        {searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((hotel) => (
              <div key={hotel.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{hotel.hotel.name}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{hotel.hotel.address.city}, {hotel.hotel.address.country}</span>
                    </div>
                    <div className="flex items-center">
                      {[...Array(Math.floor(hotel.hotel.rating))].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#72ba87]">
                      {hotel.total_amount} {hotel.total_currency}
                    </p>
                    <p className="text-sm text-gray-600">per night</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Room Types</h4>
                  <div className="space-y-2">
                    {hotel.room_types.map((room, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{room.name}</p>
                        <p className="text-sm text-gray-600">{room.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-[#72ba87] hover:bg-[#61936f] text-white"
                  onClick={() => handleBooking(hotel.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </div>
                  ) : (
                    'Book Now'
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <Hotel className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Enter your search criteria to find available hotels</p>
          </div>
        )}
      </div>
    </div>
  );
} 