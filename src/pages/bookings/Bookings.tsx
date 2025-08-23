import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plane, Download, Calendar, User, ArrowRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: 'flight' | 'hotel' | 'flight_hotel' | 'trip';
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  created_at: string;
  total_amount: number;
  currency: string;
  departure_date: string | null;
  return_date: string | null;
  duffel_order_id: string | null;
  duffel_booking_reference: string | null;
  flight_data: any; // Complete flight data from Duffel
  passengers: Array<{
    title: string;
    given_name: string;
    family_name: string;
    email: string;
    phone_number: string;
    gender: string;
    born_on: string;
  }>;
  base_amount: number;
  luggage_fees: number;
  ancillaries_fees: number;
  commission_amount: number;
  payment_status: string;
  notes: string | null;
}

export function Bookings() {
  const { t, i18n } = useTranslation('zapbooking');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: t('error'),
        description: t('failedToLoadBookings'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'HH:mm');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  const downloadBookingConfirmation = async (booking: Booking) => {
    try {
      // Here you would implement the PDF generation and download
      toast({
        title: t('comingSoonTitle'),
        description: t('pdfDownloadComingSoon'),
      });
    } catch (error) {
      console.error('Error downloading booking:', error);
      toast({
        title: t('error'),
        description: t('failedToDownloadConfirmation'),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#72ba87]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('myBookings')}</h1>
          <Button
            className="bg-[#72ba87] hover:bg-[#61936f] text-white"
            onClick={() => navigate(`/${i18n.language}/booking/internal-flights`)}
          >
            {t('bookNewFlight')}
          </Button>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plane className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('noBookingsFound')}</h3>
              <p className="text-gray-500 mb-4">{t('noBookingsMessage')}</p>
              <Button
                className="bg-[#72ba87] hover:bg-[#61936f] text-white"
                onClick={() => navigate(`/${i18n.language}/booking/internal-flights`)}
              >
                {t('bookFirstFlight')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/${i18n.language}/bookings/${booking.booking_reference}`)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Plane className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{booking.booking_reference}</h3>
                          <p className="text-sm text-gray-500">{t('bookedOn')} {formatDate(booking.created_at)}</p>
                        </div>
                      </div>
                      
                      {booking.flight_data?.slices?.[0] && (
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{booking.flight_data.slices[0].origin?.iata_code}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{booking.flight_data.slices[0].destination?.iata_code}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(booking.flight_data.slices[0].segments[0]?.departing_at)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{booking.passengers.length} {booking.passengers.length === 1 ? t('passenger') : t('passengers')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{t(`bookingTypes.${booking.booking_type}`)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <Badge 
                        variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        className={booking.status === 'confirmed' ? 'bg-[#72ba87] text-white' : ''}
                      >
                        {t(`bookingStatus.${booking.status}`)}
                      </Badge>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{booking.total_amount} {booking.currency}</p>
                        <p className="text-sm text-gray-500">{t('total')}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 