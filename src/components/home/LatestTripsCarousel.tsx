import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripData {
  id: string;
  title: string;
  description?: string;
  location?: string;
  coordinates?: string;
  created_at: string;
  trip_type: 'ZapOut' | 'ZapRoad' | 'ZapTrip';
  // ZapOut specific
  activity_types?: string[];
  activity_times?: string[];
  // ZapRoad specific
  starting_city?: string;
  end_city?: string;
  // Common fields
  adults?: number;
  kids?: number;
  budget?: number;
  currency?: string;
}

export function LatestTripsCarousel() {
  const { t, i18n } = useTranslation(['home', 'common']);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [imageUrlByTripKey, setImageUrlByTripKey] = useState<Record<string, string>>({});
  const fetchedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchLatestTrips = async () => {
      try {
        setLoading(true);
        
        // Get today's date in ISO format
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Fetch latest trips from all three tables
        const [zapOutResult, zapRoadResult, zapTripResult] = await Promise.all([
          // ZapOut trips created today
          supabase
            .from('zapout_data')
            .select('*')
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false })
            .limit(5),
          
          // ZapRoad trips created today
          supabase
            .from('zaproad_data')
            .select('*')
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false })
            .limit(5),
          
          // ZapTrip trips created today
          supabase
            .from('trips')
            .select('*')
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        // Combine and transform the results
        const allTrips: TripData[] = [
          ...(zapOutResult.data || []).map(trip => ({ ...trip, trip_type: 'ZapOut' as const })),
          ...(zapRoadResult.data || []).map(trip => ({ ...trip, trip_type: 'ZapRoad' as const })),
          ...(zapTripResult.data || []).map(trip => ({ ...trip, trip_type: 'ZapTrip' as const }))
        ];

        // Sort by creation date and take the latest 10
        const sortedTrips = allTrips
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        // If we don't have enough trips from today, fetch random trips to fill up to 10
        if (sortedTrips.length < 10) {
          const remainingCount = 10 - sortedTrips.length;
          
          const [randomZapOut, randomZapRoad, randomZapTrip] = await Promise.all([
            supabase
              .from('zapout_data')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(Math.ceil(remainingCount / 3)),
            
            supabase
              .from('zaproad_data')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(Math.ceil(remainingCount / 3)),
            
            supabase
              .from('trips')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(Math.ceil(remainingCount / 3))
          ]);

          const randomTrips: TripData[] = [
            ...(randomZapOut.data || []).map(trip => ({ ...trip, trip_type: 'ZapOut' as const })),
            ...(randomZapRoad.data || []).map(trip => ({ ...trip, trip_type: 'ZapRoad' as const })),
            ...(randomZapTrip.data || []).map(trip => ({ ...trip, trip_type: 'ZapTrip' as const }))
          ];

          // Create a set of existing trip keys to avoid duplicates
          const existingTripKeys = new Set(sortedTrips.map(trip => `${trip.trip_type}-${trip.id}`));
          
          // Filter out duplicates and shuffle
          const uniqueRandomTrips = randomTrips.filter(trip => 
            !existingTripKeys.has(`${trip.trip_type}-${trip.id}`)
          );
          const shuffledRandom = uniqueRandomTrips.sort(() => Math.random() - 0.5);
          const finalTrips = [...sortedTrips, ...shuffledRandom.slice(0, remainingCount)];
          
          // Final deduplication to ensure no duplicate keys
          const uniqueTrips = finalTrips.filter((trip, index, self) => 
            index === self.findIndex(t => `${t.trip_type}-${t.id}` === `${trip.trip_type}-${trip.id}`)
          );
          
          setTrips(uniqueTrips);
        } else {
          // Final deduplication to ensure no duplicate keys
          const uniqueTrips = sortedTrips.filter((trip, index, self) => 
            index === self.findIndex(t => `${t.trip_type}-${t.id}` === `${trip.trip_type}-${trip.id}`)
          );
          setTrips(uniqueTrips);
        }
      } catch (error) {
        console.error('Error fetching latest trips:', error);
        // Fallback to empty array
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestTrips();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000); // Auto-rotate every 4 seconds

    return () => clearInterval(interval);
  }, [api]);

  const getTripTypeColor = (tripType: string) => {
    switch (tripType) {
      case 'ZapOut':
        return 'bg-emerald-500';
      case 'ZapRoad':
        return 'bg-amber-500';
      case 'ZapTrip':
        return 'bg-sky-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTripTypeLabel = (tripType: string) => {
    switch (tripType) {
      case 'ZapOut':
        return t('home:categories.zapout', 'ZapOut');
      case 'ZapRoad':
        return t('home:categories.zaproad', 'ZapRoad');
      case 'ZapTrip':
        return t('home:categories.zaptrip', 'ZapTrip');
      default:
        return tripType;
    }
  };

  const getLocationDisplay = (trip: TripData) => {
    if (trip.trip_type === 'ZapRoad') {
      return `${trip.starting_city} → ${trip.end_city}`;
    }
    return trip.location || 'Unknown location';
  };

  const getTripKey = (trip: TripData) => `${trip.trip_type}-${trip.id}`;

  // Normalize text by removing accents and special characters
  const normalizeText = (text: string): string => {
    return text
      .normalize('NFD')                 // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics/accents
      .replace(/[^\w\s]/g, '')          // Remove special characters
      .replace(/\s+/g, ' ')             // Normalize whitespace
      .trim();                          // Trim whitespace
  };
  
  // Get possible image paths for a location name (with and without accents)
  const getPossibleImagePaths = (locationName: string): string[] => {
    // Since we're removing city-images, return empty array
    return [];
  };
  
  // Extract location components from a location string
  const extractLocationComponents = (location: string | undefined): { city: string | null; state: string | null; country: string | null } => {
    if (!location) return { city: null, state: null, country: null };
    
    const components = {
      city: null as string | null,
      state: null as string | null,
      country: null as string | null
    };
    
    // Try to extract components from "City, State, Country" or "City, Country" format
    const parts = location.split(',').map(part => part.trim());
    
    if (parts.length >= 3) {
      // Format: City, State, Country
      components.city = parts[0];
      components.state = parts[1];
      components.country = parts[2];
    } else if (parts.length === 2) {
      // Format: City, Country
      components.city = parts[0];
      components.country = parts[1];
    } else if (parts.length === 1) {
      // Just a city or country name
      components.city = parts[0];
    }
    
    return components;
  };
  
  // For ZapRoad trips, extract location components from starting city
  const extractRoadTripLocation = (trip: TripData): { city: string | null; state: string | null; country: string | null } => {
    if (!trip.starting_city) return { city: null, state: null, country: null };
    
    return extractLocationComponents(trip.starting_city);
  };
  
  // Determine an appropriate query for Google Places for this trip
  const getPlaceQueryForTrip = (trip: TripData): string | null => {
    if (trip.trip_type === 'ZapRoad') {
      return trip.starting_city || trip.end_city || null;
    }
    if (trip.location) {
      const { city, country } = extractLocationComponents(trip.location);
      // Prefer city, otherwise fall back to country or raw location
      if (city && country) return `${city}, ${country}`;
      if (city) return city;
      return trip.location;
    }
    return null;
  };

  // Use existing local images first, only fetch Google photos for missing locations
  const getImageForTrip = (trip: TripData, index: number): string => {
    // 1. Check if we already have a Google photo for this trip
    const tripKey = getTripKey(trip);
    if (imageUrlByTripKey[tripKey]) {
      return imageUrlByTripKey[tripKey];
    }

    // 2. Return default image (no more city-images)
    return '/zaparound-uploads/defaultimage.png';
  };

  // Only fetch Google photos for trips that don't have local images (reduced API calls)
  useEffect(() => {
    if (!trips || trips.length === 0) return;

    const fetchMissingImages = async () => {
      const updates: Record<string, string> = {};
      let count = 0;
      const MAX_GOOGLE_REQUESTS = 2; // Limit to 2 Google API calls per load

      for (const trip of trips) {
        if (count >= MAX_GOOGLE_REQUESTS) break;

        const key = getTripKey(trip);
        if (imageUrlByTripKey[key] || fetchedKeysRef.current.has(key)) continue;

        // Only fetch if no local image exists
        const localImage = getBackgroundImage(trip, 0);
        if (localImage && !localImage.includes('background')) continue;

        const query = getPlaceQueryForTrip(trip);
        if (!query) continue;

        fetchedKeysRef.current.add(key);
        count++;

        // TODO: Implement server-side caching for Google photos
        // For now, skip Google photos to avoid scalability issues
        // const url = await fetchGooglePlacePhotoUrl(query);
        // if (url) updates[key] = url;
      }

      if (Object.keys(updates).length > 0) {
        setImageUrlByTripKey((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchMissingImages();
  }, [trips, i18n.language]);
  
  // Get appropriate image for the trip based on location with multi-level fallback
  const getBackgroundImage = (trip: TripData, index: number) => {
    // Since we're removing city-images, always return the default image
    return '/zaparound-uploads/defaultimage.png';
  };

  if (loading) {
    return (
      <section className="bg-[#fcfcfc] text-[#030303] py-16">
        <div className="container mx-auto px-4 max-w-6xl">

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section className="bg-[#fcfcfc] text-[#030303] py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">
            {t('home:latestTrips', 'Latest Trips')}
          </h2>
          <div className="text-center text-[#62626a]">
            <p>{t('home:noTripsYet', 'No trips created yet. Be the first to create one!')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#fcfcfc] text-[#030303] py-16">
      <div className="container mx-auto px-4 max-w-6xl">


        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setApi}
            className="w-full relative"
          >
            <CarouselContent className="-ml-2">
              {trips.map((trip, index) => (
                <CarouselItem key={`${trip.trip_type}-${trip.id}`} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4">
                  <div className="group cursor-pointer">
                    <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
                        <img
                          src={getImageForTrip(trip, index)}
                          alt={trip.title}
                          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const currentSrc = target.src;
                            target.onerror = null; // Prevent infinite loop
                            
                            // Fall back to default image
                            target.src = '/zaparound-uploads/defaultimage.png';
                          }}
                        />
                        
                        <div className="absolute inset-0 z-20 p-3 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <Badge className={cn("text-white border-0 text-xs", getTripTypeColor(trip.trip_type))}>
                              {getTripTypeLabel(trip.trip_type)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col items-start">
                            <div className="flex items-center text-white/90 text-sm font-bold mb-1">
                              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {getLocationDisplay(trip)}
                              </span>
                            </div>
                            {trip.adults && (
                              <div className="flex items-center text-white/80 text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{trip.adults + (trip.kids || 0)} {t('home:travelers', 'travelers')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="absolute -left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 border-none text-[#030303] hover:bg-white shadow-md" />
              <CarouselNext className="absolute -right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 border-none text-[#030303] hover:bg-white shadow-md" />
            </div>
          </Carousel>
          
          {/* Shadow indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.min(count, 8) }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  current === index + 1 
                    ? "bg-[#61936f] w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 