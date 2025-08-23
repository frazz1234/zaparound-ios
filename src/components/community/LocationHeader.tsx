import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Calendar, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { EventCarousel } from './EventCarousel';
import { getCachedLocation, setCachedLocation } from '@/lib/utils';

interface LocationData {
  city: string;
  region: string;
  country: string;
  formatted: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface EventbriteEvent {
  id: string;
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;
  timezone: string;
  imageUrl?: string;
  venue?: {
    name: string;
    address: {
      city: string;
      region: string;
    };
  };
}

export function LocationHeader() {
  const { t } = useTranslation('community');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventbriteEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(30);

  const getLocationFromCoords = async (latitude: number, longitude: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { latitude, longitude }
      });

      if (error) {
        throw error;
      }

      if (data) {
        const locationData = {
          city: data.city,
          region: data.region,
          country: data.country,
          formatted: data.formatted,
          coordinates: {
            latitude,
            longitude
          }
        };
        
        setLocation(locationData);
        setCachedLocation(locationData);

        // After getting location, fetch nearby events
        fetchNearbyEvents(latitude, longitude);
      } else {
        throw new Error('Location not found');
      }
    } catch (err) {
      console.error('Error fetching location details:', err);
      setError(t('locationError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyEvents = async (latitude: number, longitude: number) => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase.functions.invoke('eventbrite-events', {
        body: { latitude, longitude, radius: searchRadius }
      });

      if (error) throw error;
      setEvents(data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const detectLocation = () => {
    setLoading(true);
    setError(null);
    setEvents([]);
    
    // Check for cached location first
    const cachedLocation = getCachedLocation();
    if (cachedLocation) {
      setLocation(cachedLocation.data);
      fetchNearbyEvents(
        cachedLocation.data.coordinates.latitude,
        cachedLocation.data.coordinates.longitude
      );
      setLoading(false);
      return;
    }
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          getLocationFromCoords(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(t('locationPermissionError'));
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setError(t('locationNotSupported'));
      setLoading(false);
    }
  };

  // Add effect to refetch events when radius changes
  useEffect(() => {
    if (location?.coordinates) {
      fetchNearbyEvents(location.coordinates.latitude, location.coordinates.longitude);
    }
  }, [searchRadius]);

  // Initial location detection
  useEffect(() => {
    detectLocation();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Mobile Layout */}
      <div className="flex flex-col space-y-4 sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="flex items-center space-x-2 text-[#030303]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t('detectingLocation')}</span>
              </div>
            ) : error ? (
              <div className="flex items-center space-x-2">
                <p className="text-red-500 text-sm">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={detectLocation}
                  className="text-[#62626a] hover:text-[#030303]"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  {t('retryLocation')}
                </Button>
              </div>
            ) : location ? (
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-[#61936f]" />
                <div>
                  <h2 className="text-[#030303] font-medium leading-snug">
                    {t('yourLocation')}
                  </h2>
                  <p className="text-sm text-[#62626a] truncate max-w-[200px]">
                    {location.formatted}
                  </p>
                </div>
              </div>
            ) : null}

            {location && (
              <Button
                variant="ghost"
                size="sm"
                onClick={detectLocation}
                className="text-[#62626a] hover:text-[#030303] ml-auto"
              >
                {t('updateLocation')}
              </Button>
            )}
          </div>
        </div>

        {location && (
          <div className="flex items-center space-x-3 px-1">
            <Navigation className="h-4 w-4 text-[#62626a]" />
            <div className="flex-1 w-24">
              <Slider
                value={[searchRadius]}
                onValueChange={(value) => setSearchRadius(value[0])}
                min={1}
                max={50}
                step={1}
                className="[&_.bg-primary]:bg-[#61936f]"
              />
            </div>
            <span className="text-sm font-medium text-[#62626a] min-w-[3ch]">
              {searchRadius}
              <span className="text-[#62626a]/60 ml-0.5">km</span>
            </span>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="flex items-center space-x-2 text-[#030303]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t('detectingLocation')}</span>
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2">
              <p className="text-red-500 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={detectLocation}
                className="text-[#62626a] hover:text-[#030303]"
              >
                <MapPin className="h-4 w-4 mr-1" />
                {t('retryLocation')}
              </Button>
            </div>
          ) : location ? (
            <>
              <MapPin className="h-5 w-5 text-[#61936f]" />
              <div>
                <h2 className="text-[#030303] font-medium">
                  {t('yourLocation')}
                </h2>
                <p className="text-sm text-[#62626a]">{location.formatted}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={detectLocation}
                className="text-[#62626a] hover:text-[#030303] ml-2"
              >
                {t('updateLocation')}
              </Button>
            </>
          ) : null}
        </div>

        {location && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[#62626a]">
              <Navigation className="h-4 w-4" />
              <span className="text-sm font-medium">{searchRadius}km</span>
            </div>
            <div className="w-24">
              <Slider
                value={[searchRadius]}
                onValueChange={(value) => setSearchRadius(value[0])}
                min={1}
                max={50}
                step={1}
                className="[&_.bg-primary]:bg-[#61936f]"
              />
            </div>
          </div>
        )}
      </div>

      {location && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#61936f]" />
            <h2 className="text-lg font-medium text-[#030303]">
              {t('nearbyEvents')}
            </h2>
          </div>
          
          <EventCarousel
            events={events}
            isLoading={loadingEvents}
            loadingText={t('loadingEvents')}
            noEventsText={t('noEventsFound')}
          />
        </div>
      )}
    </motion.div>
  );
} 