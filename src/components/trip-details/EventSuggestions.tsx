import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EventSuggestion {
  id: string;
  location: string;
  type: string;
  title: string;
  description: string;
  image_url?: string;
  priority: number;
  created_at: string;
  url_link?: string;
  url_placeholder_image?: string;
  content?: string;
  business_name?: string;
  expiration_date?: string;
}

type EventType = 'all' | 'hotel' | 'restaurant' | 'bar' | 'event' | 'activity' | 'other';

interface EventSuggestionProps {
  location: string;
}

export function EventSuggestions({ location }: EventSuggestionProps) {
  const { t } = useTranslation('recommendations');
  const [events, setEvents] = useState<EventSuggestion[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<EventType>('all');
  const [availableTypes, setAvailableTypes] = useState<EventType[]>(['all']);
  const [selectedEvent, setSelectedEvent] = useState<EventSuggestion | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenSize, setScreenSize] = useState(() => {
    const width = window.innerWidth;
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    return 'sm';
  });

  const eventsPerView = screenSize === 'lg' ? 3 : screenSize === 'md' ? 2 : 1;

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newSize = width >= 1024 ? 'lg' : width >= 768 ? 'md' : 'sm';
      if (newSize !== screenSize) {
        setScreenSize(newSize);
        setCurrentIndex(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screenSize]);

  useEffect(() => {
    fetchEventSuggestions();
  }, [location]);

  useEffect(() => {
    filterEvents();
  }, [selectedType, events]);

  useEffect(() => {
    // Update available types whenever events change
    const types = new Set(['all']);
    events.forEach(event => {
      if (event.type) {
        types.add(event.type.toLowerCase() as EventType);
      }
    });
    setAvailableTypes(Array.from(types) as EventType[]);
  }, [events]);

  const filterEvents = () => {
    if (selectedType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.type.toLowerCase() === selectedType.toLowerCase()));
    }
    setCurrentIndex(0);
  };

  const fetchEventSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('event_suggestion')
        .select('*')
        .eq('location', location)
        .order('priority', { ascending: true });

      if (error) throw error;

      // Randomize events with the same priority
      const sortedEvents = data.reduce((acc, event) => {
        const priorityGroup = acc.get(event.priority) || [];
        priorityGroup.push(event);
        acc.set(event.priority, priorityGroup);
        return acc;
      }, new Map<number, EventSuggestion[]>());

      const finalEvents: EventSuggestion[] = [];
      sortedEvents.forEach((group) => {
        // Shuffle each priority group
        for (let i = group.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [group[i], group[j]] = [group[j], group[i]];
        }
        finalEvents.push(...group);
      });

      setEvents(finalEvents);
      setFilteredEvents(finalEvents);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching event suggestions:', err);
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (isTransitioning || currentIndex >= Math.ceil(filteredEvents.length / eventsPerView) - 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevSlide = () => {
    if (isTransitioning || currentIndex === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800';
      case 'restaurant':
        return 'bg-orange-100 text-orange-800';
      case 'bar':
        return 'bg-purple-100 text-purple-800';
      case 'event':
        return 'bg-green-100 text-green-800';
      case 'activity':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const typeOptions = [...availableTypes];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`animate-pulse ${
                  (i === 2 && screenSize === 'sm') || (i === 3 && screenSize !== 'lg') 
                    ? 'hidden' 
                    : i === 2 
                    ? 'hidden md:block' 
                    : ''
                }`}
              >
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4">
          <h2 className="text-xl font-bold text-[#030303]">
            {t('zaparound.recommendations')}
          </h2>
        </div>
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                {/* Removed the select dropdown */}
              </div>

              {availableTypes.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type as EventType)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedType === type
                          ? 'bg-[#1d1d1e] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? t('types.all') : t(`types.${type}`)}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-transform duration-300 ease-in-out"
                )}
                style={{
                  transform: `translateX(-${currentIndex * (100 / eventsPerView)}%)`
                }}
                >
                  {filteredEvents
                    .slice(currentIndex * eventsPerView, (currentIndex + 1) * eventsPerView)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="relative group cursor-pointer w-full"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="aspect-[16/10] overflow-hidden rounded-lg">
                          <img
                            src={event.url_placeholder_image || event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                        <div className="mt-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.business_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                              {capitalizeFirstLetter(event.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {filteredEvents.length > eventsPerView && (
                  <>
                    <button
                      onClick={prevSlide}
                      disabled={isTransitioning || currentIndex === 0}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      disabled={isTransitioning || currentIndex >= Math.ceil(filteredEvents.length / eventsPerView) - 1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="aspect-[16/10] overflow-hidden rounded-lg mb-4">
              <img
                src={selectedEvent?.url_placeholder_image || selectedEvent?.image_url}
                alt={selectedEvent?.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/placeholder-image.jpg';
                }}
              />
            </div>
            <p className="text-gray-600 mb-2">
              {selectedEvent?.business_name} • {selectedEvent?.location}
            </p>
            <p className="text-gray-800">{selectedEvent?.content || selectedEvent?.description}</p>
            {selectedEvent?.url_link && (
              <a
                href={selectedEvent.url_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-600 hover:text-blue-800"
              >
                {t('learnMore')} →
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 