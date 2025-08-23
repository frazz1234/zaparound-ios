import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
import { 
  Plane, 
  Download, 
  Calendar, 
  User, 
  ArrowLeft, 
  MapPin, 
  Clock,
  CreditCard,
  FileText,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { EmailBookingDialog } from "@/components/bookings/EmailBookingDialog";

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
  flight_data: any;
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

export function BookingDetail() {
  const { t, i18n } = useTranslation('zapbooking');
  const navigate = useNavigate();
  const { bookingReference } = useParams<{ bookingReference: string }>();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (bookingReference) {
      fetchBooking();
    }
  }, [bookingReference]);

  const fetchBooking = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_reference', bookingReference)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
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

  const downloadBookingConfirmation = async () => {
    try {
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

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('bookingDetails.bookingNotFound')}</h3>
              <p className="text-gray-500 mb-4">{t('bookingDetails.bookingNotFoundMessage')}</p>
              <Button
                className="bg-[#72ba87] hover:bg-[#61936f] text-white"
                onClick={() => navigate(`/${i18n.language}/bookings`)}
              >
                {t('bookingDetails.backToBookings')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/${i18n.language}/bookings`)}
              className="text-[#1d1d1e] hover:text-[#61936f]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('bookingDetails.backToBookings')}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-3xl font-bold">{t('bookingDetails.bookingDetails')}</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(true)}
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('bookingDetails.sendByEmail')}
            </Button>
            <Button
              variant="outline"
              onClick={downloadBookingConfirmation}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('bookingDetails.downloadConfirmation')}
            </Button>
          </div>
        </div>

        {/* Booking Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {booking.booking_reference}
                </CardTitle>
                <CardDescription>
                  {t('bookingDetails.bookedOn')} {formatDate(booking.created_at)} • {t(`bookingTypes.${booking.booking_type}`)} {t('bookingDetails.bookingType')}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge 
                  variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                  className={booking.status === 'confirmed' ? 'bg-[#72ba87] text-white' : ''}
                >
                  {t(`bookingStatus.${booking.status}`)}
                </Badge>
                <div className="text-right">
                  <p className="text-2xl font-bold">{booking.total_amount} {booking.currency}</p>
                  <p className="text-sm text-gray-500">{t('bookingDetails.totalAmountLabel')}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flight Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="w-5 h-5 mr-2" />
                  {t('bookingDetails.flightDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {booking.flight_data?.slices?.map((slice: any, index: number) => (
                  <div key={index}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Plane className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">
                            {slice.origin?.iata_code} → {slice.destination?.iata_code}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(slice.segments[0]?.departing_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{slice.segments[0]?.marketing_carrier?.name}</p>
                        <p className="text-sm text-gray-500">
                          Flight {slice.segments[0]?.marketing_carrier?.iata_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Clock className="w-4 h-4 mr-2 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">{t('bookingDetails.departure')}</p>
                        </div>
                        <p className="text-lg font-semibold">{formatTime(slice.segments[0]?.departing_at)}</p>
                        <p className="text-sm">{slice.origin?.name}</p>
                        {slice.segments[0]?.origin_terminal && (
                          <p className="text-sm text-gray-500">{t('bookingDetails.terminal')} {slice.segments[0].origin_terminal}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <p className="text-sm font-medium text-gray-700">{t('bookingDetails.arrival')}</p>
                        </div>
                        <p className="text-lg font-semibold">{formatTime(slice.segments[0]?.arriving_at)}</p>
                        <p className="text-sm">{slice.destination?.name}</p>
                        {slice.segments[0]?.destination_terminal && (
                          <p className="text-sm text-gray-500">{t('bookingDetails.terminal')} {slice.segments[0].destination_terminal}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Passenger Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {t('bookingDetails.passengers')} ({booking.passengers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.passengers.map((passenger, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">
                        {passenger.title} {passenger.given_name} {passenger.family_name}
                      </p>
                      <p className="text-sm text-gray-500">{passenger.email}</p>
                      <p className="text-sm text-gray-500">{passenger.phone_number}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{t('bookingDetails.gender')}: {passenger.gender === 'm' ? t('bookingDetails.male') : t('bookingDetails.female')}</span>
                        <span>{t('bookingDetails.born')}: {formatDate(passenger.born_on)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  {t('bookingDetails.financialDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('bookingDetails.baseFare')}</span>
                    <span className="font-medium">{booking.base_amount.toFixed(2)} {booking.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('bookingDetails.taxesFees')}</span>
                    <span className="font-medium">{(booking.total_amount - booking.base_amount - booking.luggage_fees - booking.ancillaries_fees).toFixed(2)} {booking.currency}</span>
                  </div>
                  {booking.luggage_fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('bookingDetails.luggageFees')}</span>
                      <span className="font-medium">{booking.luggage_fees} {booking.currency}</span>
                    </div>
                  )}
                  {booking.ancillaries_fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('bookingDetails.ancillariesFees')}</span>
                      <span className="font-medium">{booking.ancillaries_fees} {booking.currency}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('bookingDetails.totalAmount')}</span>
                    <span>{booking.total_amount} {booking.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking References */}
            {booking.duffel_booking_reference && (
              <Card>
                <CardHeader>
                                  <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  {t('bookingDetails.bookingReferences')}
                </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">{t('reference')}</p>
                      <p className="font-medium text-sm">{booking.duffel_booking_reference}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      {booking && (
        <EmailBookingDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          bookingData={booking}
        />
      )}
    </div>
  );
} 