import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TripList } from '@/components/dashboard/TripList';
import { Trip } from '@/hooks/useTrips';
import { useTranslation } from 'react-i18next';

interface DashboardContentProps {
  loading: boolean;
  trips: Trip[];
  fullName: string | null;
  onTripCreated: () => void;
  onDeleteTrip: (tripId: string) => Promise<boolean>;
  userRole: string | null;
  hasFreeTrip: boolean;
}

export function DashboardContent({ 
  loading,
  trips,
  fullName,
  onTripCreated,
  onDeleteTrip,
  userRole,
  hasFreeTrip
}: DashboardContentProps) {
  const { t } = useTranslation('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // For nosubs users with free trip, only show their free trip
  const displayTrips = trips;

  return (
    <motion.div
      className="container mx-auto p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <DashboardHeader 
        fullName={fullName}
        onTripCreated={onTripCreated}
        userRole={userRole}
        hasFreeTrip={hasFreeTrip}
      />
      
      {loading ? (
        <p className="text-center text-gray-500">{t('loading')}</p>
      ) : (
        <TripList 
          trips={displayTrips} 
          onDeleteTrip={onDeleteTrip}
          userRole={userRole}
          hasFreeTrip={hasFreeTrip}
        />
      )}
    </motion.div>
  );
}
