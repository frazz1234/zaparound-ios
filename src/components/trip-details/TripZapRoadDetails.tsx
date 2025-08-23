import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, MapPin, Calendar } from "lucide-react";

interface TripZapRoadDetailsProps {
  tripId: string;
  isDirectZapRoad?: boolean;
  notes?: string | null;
  isEditingNotes?: boolean;
  onNotesChange?: (value: string) => void;
}

export function TripZapRoadDetails({ 
  tripId, 
  isDirectZapRoad = false,
  notes,
  isEditingNotes = false,
  onNotesChange
}: TripZapRoadDetailsProps) {
  const [zapRoadData, setZapRoadData] = useState<any>(null);
  const { t, i18n } = useTranslation('trip');

  useEffect(() => {
    const fetchZapRoadData = async () => {
      try {
        const { data, error } = await supabase
          .from('zaproad_data')
          .select('*')
          .eq('trip_id', tripId)
          .single();

        if (error) throw error;
        setZapRoadData(data);
      } catch (error) {
        console.error('Error fetching ZapRoad data:', error);
      }
    };

    fetchZapRoadData();
  }, [tripId]);

  if (!zapRoadData) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      let locale = enUS;
      if (i18n.language === 'fr') locale = fr;
      else if (i18n.language === 'es') locale = es;
      if (isValid(date)) {
        return format(date, 'PPP', { locale });
      }
      const fallbackDate = new Date(dateString);
      return isValid(fallbackDate) ? format(fallbackDate, 'PPP', { locale }) : '';
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('types.zapRoad.roadTripDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{t('types.zapRoad.route')}</p>
              <p className="text-sm text-gray-600">
                From {zapRoadData.starting_city} to {zapRoadData.end_city}
                {zapRoadData.stopover_cities && JSON.parse(zapRoadData.stopover_cities).length > 0 && (
                  <span> via {JSON.parse(zapRoadData.stopover_cities).map((city: any) => city.name).join(', ')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{t('types.zapRoad.numberOfPeople')}</p>
              <p className="text-sm text-gray-600">{zapRoadData.number_of_people}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{t('types.zapRoad.vehicleType')}</p>
              <p className="text-sm text-gray-600">{zapRoadData.has_electric_car ? t('types.zapRoad.electricCar') : t('types.zapRoad.regularCar')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">{t('types.zapRoad.dates')}</p>
              <p className="text-sm text-gray-600">
                {formatDate(zapRoadData.start_date)} - {formatDate(zapRoadData.end_date)}
              </p>
            </div>
          </div>

          {zapRoadData.special_requirements && (
            <div>
              <p className="font-medium">{t('types.zapRoad.specialRequirements')}</p>
              <p className="text-sm text-gray-600">{zapRoadData.special_requirements}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 