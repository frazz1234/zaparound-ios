import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TripType } from "../subtrip-utils/freeTripValidation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface FreeTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  remaining: number | null;
  nextReset: string | null;
  tripType: TripType;
}

export const FreeTripDialog = ({
  isOpen,
  onClose,
  onUpgrade,
  remaining,
  nextReset,
  tripType
}: FreeTripDialogProps) => {
  const { t } = useTranslation('trip');

  const getTripTypeName = (type: TripType) => {
    switch (type) {
      case 'zaproad':
        return 'ZapRoad';
      case 'zaptrip':
        return 'ZapTrip';
      case 'zapout':
        return 'ZapOut';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-lg sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{t('freeTrip.status')}</DialogTitle>
          <div className="space-y-4">
            {remaining === 0 ? (
              <>
                <div className="text-sm text-muted-foreground">
                  {t('freeTrip.allUsed', { type: getTripTypeName(tripType) })}
                </div>
                {nextReset && (
                  <div className="text-sm text-muted-foreground">
                    {t('freeTrip.nextReset', { date: format(new Date(nextReset), 'MMMM d, yyyy') })}
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={onUpgrade} 
                    className={cn(
                      "relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
                    )}
                  >
                    {t('freeTrip.upgrade', { type: getTripTypeName(tripType) })}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    className="w-full text-[#61936f] hover:text-[#4a7256] border-[#61936f] hover:bg-[#61936f]/10"
                  >
                    {t('freeTrip.maybeLater')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  {t('freeTrip.remaining', { 
                    count: remaining,
                    type: getTripTypeName(tripType)
                  })}
                </div>
                {nextReset && (
                  <div className="text-sm text-muted-foreground">
                    {t('freeTrip.resetDate', { date: format(new Date(nextReset), 'MMMM d, yyyy') })}
                  </div>
                )}
                <Button 
                  onClick={onClose} 
                  className={cn(
                    "relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
                  )}
                >
                  {t('freeTrip.continue')}
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}; 