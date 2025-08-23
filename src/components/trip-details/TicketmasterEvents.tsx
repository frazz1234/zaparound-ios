import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { EventCarousel } from '@/components/community/EventCarousel';

interface TicketmasterEventsProps {
  city: string;
  coordinates?: [number, number];
}

export function TicketmasterEvents({ city, coordinates }: TicketmasterEventsProps) {
  const { t } = useTranslation('trip');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketmasterEvents();
  }, [city, coordinates]);

  const fetchTicketmasterEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('events-api-search', {
        body: { 
          city,
          ...(coordinates && {
            latitude: coordinates[1],
            longitude: coordinates[0]
          })
        }
      });

      if (error) throw error;

      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching Ticketmaster events:', err);
      if (err instanceof Error && err.message.includes('429')) {
        return null;
      }
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold text-[#030303]">
          {t('events.nearbyEvents')}
        </h2>
      </div>
      <div className="p-4">
        <EventCarousel
          events={events}
          isLoading={loading}
          loadingText={t('events.loading')}
          noEventsText={t('events.noEvents')}
        />
      </div>
    </div>
  );
} 