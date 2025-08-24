import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventbriteEvent {
  id: string;
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;
  timezone: string;
  imageUrl?: string;
  type?: string;
  venue?: {
    name: string;
    address: {
      city: string;
      region: string;
    };
  };
}

interface EventCarouselProps {
  events: EventbriteEvent[];
  isLoading: boolean;
  loadingText: string;
  noEventsText: string;
}

const EVENT_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'sports', label: 'Sports' },
  { id: 'arts', label: 'Arts & Theatre' },
  { id: 'family', label: 'Family' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'film', label: 'Film' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'festival', label: 'Festivals' },
  { id: 'business', label: 'Business' },
  { id: 'other', label: 'Other' }
];

export function EventCarousel({ events, isLoading, loadingText, noEventsText }: EventCarouselProps) {
  const [selectedType, setSelectedType] = useState('all');

  // Calculate available event types
  const availableEventTypes = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0) return [];
    
    const typeCounts = events.reduce((acc, event) => {
      const type = event.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return EVENT_TYPES.filter(type => 
      type.id === 'all' || typeCounts[type.id] > 0
    );
  }, [events]);

  const filteredEvents = selectedType === 'all' 
    ? events 
    : events.filter(event => event.type?.toLowerCase() === selectedType);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg bg-[#f4f4f5] h-24 sm:h-32 mb-2" />
            <div className="space-y-1">
              <div className="h-3 bg-[#f4f4f5] rounded w-3/4" />
              <div className="h-2 bg-[#f4f4f5] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="text-center py-6 text-[#62626a]">
        <p>{noEventsText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {availableEventTypes.length > 1 && (
        <div className="relative">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {availableEventTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                  selectedType === type.id
                    ? "bg-[#61936f] text-white shadow-sm"
                    : "bg-white text-[#62626a] hover:bg-gray-50 border border-gray-200"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
          {/* Scroll indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white pointer-events-none" />
        </div>
      )}

      <div className="relative -mx-2">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {filteredEvents.map((event) => (
              <CarouselItem key={event.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4">
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="relative rounded-lg overflow-hidden">
                    <div className="relative aspect-[16/9] sm:aspect-[4/3] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
                      <img
                        src={event.imageUrl || '/placeholder-event.jpg'}
                        alt={event.name}
                        className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                      />
                      
                      <div className="absolute inset-0 z-20 p-1.5 sm:p-2 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-white/90 text-[#030303] hover:bg-white text-[10px] sm:text-xs">
                            {format(new Date(event.startDate), 'MMM d')}
                          </Badge>
                        </div>
                        
                        <div>
                          <h3 className="text-xs sm:text-sm text-white font-medium mb-0.5 line-clamp-2 group-hover:text-[#61936f] transition-colors">
                            {event.name}
                          </h3>
                          {event.venue && (
                            <div className="flex items-center text-white/80 text-[10px] sm:text-xs">
                              <MapPin className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                              <span className="truncate">
                                {event.venue.address.city}, {event.venue.address.region}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/80 border-none text-[#030303] hover:bg-white shadow-md" />
            <CarouselNext className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/80 border-none text-[#030303] hover:bg-white shadow-md" />
          </div>
        </Carousel>
      </div>
    </div>
  );
} 