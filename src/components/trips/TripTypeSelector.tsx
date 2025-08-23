import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Plane, MapPin, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export type TripType = "ZapTrip" | "ZapOut" | "ZapRoad";

interface TripTypeSelectorProps {
  selectedType: TripType | null;
  onSelectType: (type: TripType) => void;
}

export function TripTypeSelector({ selectedType, onSelectType }: TripTypeSelectorProps) {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation('trip');
  const navigate = useNavigate();
  const { userRole, loading: roleLoading } = useUserRole();

  useEffect(() => {
    setLoading(roleLoading);
  }, [roleLoading]);

  const canAccessAll = userRole === 'admin' || userRole === 'tier2' || userRole === 'tier3';
  const canAccessTier1 = userRole === 'admin' || userRole === 'tier1' || userRole === 'tier2' || userRole === 'tier3';
  const isNoSubs = userRole === 'nosubs' || userRole === null;

  const handleCardClick = (type: TripType) => {
    if (isNoSubs) {
      toast({
        title: t('navigation.subscriptionRequired'),
        description: t('navigation.createZapNotAvailable'),
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }
    
    if (type !== 'ZapTrip' && !canAccessAll) {
      toast({
        title: t('selection.featureNotAvailable'),
        description: t('selection.upgradeRequired'),
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }
    
    onSelectType(type);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {['ZapTrip', 'ZapOut', 'ZapRoad'].map((type) => (
            <Card key={type} className="h-28 sm:h-36 animate-pulse bg-gray-100">
              <CardContent className="flex items-center justify-center h-full">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getIcon = (type: TripType) => {
    switch (type) {
      case 'ZapTrip':
        return <Plane className="h-6 w-6 mb-2.5 text-primary" />;
      case 'ZapOut':
        return <MapPin className="h-6 w-6 mb-2.5 text-blue-600" />;
      case 'ZapRoad':
        return <Car className="h-6 w-6 mb-2.5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card 
          className={`relative cursor-pointer hover:shadow-md transition-shadow touch-manipulation
            ${isNoSubs ? 'opacity-40' : ''} 
            ${selectedType === 'ZapTrip' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('ZapTrip')}
        >
          <CardContent className="flex flex-col items-center justify-center min-h-[7rem] sm:min-h-[9rem] p-3 sm:p-4">
            {getIcon('ZapTrip')}
            <span className="text-base sm:text-lg font-medium mb-1.5">ZapTrip</span>
            <p className="text-xs sm:text-sm text-gray-500 text-center">{t('selection.zapTripDesc')}</p>
            {isNoSubs && (
              <div className="absolute top-2 right-2">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`relative cursor-pointer hover:shadow-md transition-shadow touch-manipulation
            ${!canAccessAll ? 'opacity-40' : ''} 
            ${selectedType === 'ZapOut' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('ZapOut')}
        >
          <CardContent className="flex flex-col items-center justify-center min-h-[7rem] sm:min-h-[9rem] p-3 sm:p-4">
            {getIcon('ZapOut')}
            <span className="text-base sm:text-lg font-medium mb-1.5">{t('selection.zapOut')}</span>
            <p className="text-xs sm:text-sm text-gray-500 text-center">{t('selection.zapOutDesc')}</p>
            {!canAccessAll && (
              <div className="absolute top-2 right-2">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`relative cursor-pointer hover:shadow-md transition-shadow touch-manipulation
            ${!canAccessAll ? 'opacity-40' : ''} 
            ${selectedType === 'ZapRoad' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('ZapRoad')}
        >
          <CardContent className="flex flex-col items-center justify-center min-h-[7rem] sm:min-h-[9rem] p-3 sm:p-4">
            {getIcon('ZapRoad')}
            <span className="text-base sm:text-lg font-medium mb-1.5">{t('selection.zapRoad')}</span>
            <p className="text-xs sm:text-sm text-gray-500 text-center">{t('selection.zapRoadDesc')}</p>
            {!canAccessAll && (
              <div className="absolute top-2 right-2">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
