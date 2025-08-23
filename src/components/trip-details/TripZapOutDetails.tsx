import { useOptimizedQueries } from '@/hooks/useOptimizedQueries';
import { ZapOutDetailsCard } from '../trips/trip-types/zap-out/ZapOutDetailsCard';
import { Card, CardContent } from '../ui/card';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';
import { TripNotes } from './TripNotes';
import { useNavigate } from 'react-router-dom';

interface TripZapOutDetailsProps {
  tripId: string | undefined;
  isDirectZapOut?: boolean;
  notes?: string | null;
  isEditingNotes?: boolean;
  onNotesChange?: (notes: string) => void;
}

export function TripZapOutDetails({ 
  tripId, 
  isDirectZapOut = false,
  notes,
  isEditingNotes = false,
  onNotesChange
}: TripZapOutDetailsProps) {
  const { t } = useTranslation('trip');
  const navigate = useNavigate();
  const { useZapOutData } = useOptimizedQueries();
  
  const { 
    data: zapOutData,
    isLoading,
    error 
  } = useZapOutData(tripId, {
    enabled: !!tripId,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching ZapOut data:', error);
        if (error.message === 'Not authenticated') {
          navigate('/login');
        } else if (error.message === 'Unauthorized') {
          navigate('/dashboard');
        }
      }
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('types.zapOut.details.title')}</h3>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !zapOutData) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">{t('types.zapOut.details.title')}</h3>
          <p className="text-muted-foreground">{t('types.zapOut.details.noDataAvailable')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ZapOutDetailsCard 
        zapOutData={zapOutData} 
      />
      {onNotesChange && (
        <TripNotes 
          notes={notes} 
          isEditing={isEditingNotes} 
          onChange={onNotesChange} 
          label={t('types.zapOut.details.notes')}
        />
      )}
    </div>
  );
}
