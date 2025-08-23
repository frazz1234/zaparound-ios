import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react';


interface AncillariesStepProps {
  offerId: string;
  passengers: Array<{
    id: string;
    title: string;
    given_name: string;
    family_name: string;
    email: string;
    phone_number: string;
    gender: string;
    born_on: string;
  }>;
  onAncillariesSelected: (payload: any, metadata: any) => void;
  onBack: () => void;
  onContinue: () => void;
  selectedAncillaries?: any;
  ancillariesMetadata?: any;
}

export function AncillariesStep({
  offerId,
  passengers,
  onAncillariesSelected,
  onBack,
  onContinue,
  selectedAncillaries,
  ancillariesMetadata
}: AncillariesStepProps) {
  const { t } = useTranslation('booking');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ancillariesData, setAncillariesData] = useState<any>(null);

  useEffect(() => {
    // Initialize ancillaries data when component mounts
    if (offerId && passengers.length > 0) {
      setAncillariesData({
        offer_id: offerId,
        passengers: passengers.map(passenger => ({
          id: passenger.id,
          title: passenger.title,
          given_name: passenger.given_name,
          family_name: passenger.family_name,
          email: passenger.email,
          phone_number: passenger.phone_number,
          gender: passenger.gender === 'male' ? 'm' : 'f',
          born_on: passenger.born_on
        }))
      });
    }
  }, [offerId, passengers]);

  const handleAncillariesChange = (payload: any, metadata: any) => {
    onAncillariesSelected(payload, metadata);
  };

  const calculateAncillariesTotal = () => {
    if (!ancillariesMetadata) return 0;
    const basePrice = parseFloat(ancillariesMetadata.offer_total_amount || '0');
    const originalPrice = parseFloat(ancillariesMetadata.original_offer_total_amount || '0');
    return basePrice - originalPrice;
  };

  const hasAncillaries = selectedAncillaries && Object.keys(selectedAncillaries).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#1d1d1e] mb-2">
          {t('details.ancillariesSelection')}
        </h2>
        <p className="text-[#62626a]">
          {t('details.ancillariesSelectionDesc')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-[#61936f]" />
            <span>{t('ancillaries.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('ancillaries.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Error loading ancillaries</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : ancillariesData ? (
            <div className="space-y-4">
                             <div className="text-center py-8">
                 <p className="text-[#62626a] mb-4">
                   Additional services like seat selection and extra baggage will be available during the booking process.
                 </p>
                 <p className="text-sm text-[#62626a]">
                   You can add these services when you complete your booking with the airline.
                 </p>
               </div>
              
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#61936f] mr-2" />
                  <span className="text-[#62626a]">{t('ancillaries.loading')}</span>
                </div>
              )}

              {hasAncillaries && ancillariesMetadata && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">
                        {t('ancillaries.selectServices')}
                      </p>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedAncillaries).map(([passengerId, services]: [string, any]) => {
                          const passenger = passengers.find(p => p.id === passengerId);
                          return (
                            <div key={passengerId} className="text-sm text-green-700">
                              <span className="font-medium">
                                {passenger ? `${passenger.given_name} ${passenger.family_name}` : 'Passenger'}:
                              </span>
                              <div className="ml-4 mt-1 space-y-1">
                                {services.bags && services.bags.length > 0 && (
                                  <div>
                                    <span className="font-medium">Bags:</span>
                                    {services.bags.map((bag: any, index: number) => (
                                      <Badge key={index} variant="secondary" className="ml-2">
                                        {bag.type} - {bag.weight}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {services.seats && services.seats.length > 0 && (
                                  <div>
                                    <span className="font-medium">Seats:</span>
                                    {services.seats.map((seat: any, index: number) => (
                                      <Badge key={index} variant="secondary" className="ml-2">
                                        {seat.designator}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {calculateAncillariesTotal() > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-sm text-green-700">
                            <span className="font-medium">Additional cost:</span> {ancillariesMetadata.offer_total_currency} {calculateAncillariesTotal().toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#61936f] mx-auto mb-4" />
              <p className="text-[#62626a]">{t('ancillaries.loading')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('navigation.backToPassengers')}
        </Button>
        
        <Button
          onClick={onContinue}
          className="bg-[#61936f] hover:bg-[#4a7a5a] text-white"
          disabled={isLoading}
        >
          {t('navigation.continueToLuggage')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
} 