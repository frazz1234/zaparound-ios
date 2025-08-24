import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import CreateTrip from '@/pages/create-trip';
import { X, PlusCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { validateFreeTrip } from '@/components/subtrip/subtrip-utils/freeTripValidation';
import { FreeTripDialog } from '@/components/subtrip/subtrip-dialogs/FreeTripDialog';
import { UpgradeModal } from '@/components/UpgradeModal';
import { supabase } from '@/integrations/supabase/client';

interface FullCreateTripDialogProps {
  session: any;
  buttonVariant?: "default" | "mobile";
}

export function FullCreateTripDialog({ session, buttonVariant = "default" }: FullCreateTripDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [showFreeTripDialog, setShowFreeTripDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [freeTripStatus, setFreeTripStatus] = useState<{
    can_use: boolean;
    remaining: number | null;
    next_reset: string | null;
    message: string;
  } | null>(null);
  const { t } = useTranslation('trip');
  const [isLandscape, setIsLandscape] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Handle screen orientation and resize
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      setWindowHeight(window.innerHeight);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleCreateTrip = async () => {
    if (!session) {
      setOpen(true);
      return;
    }

    try {
      // Check if user has a subscription
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      // If user has no subscription, validate free trip usage
      if (userRole?.role === 'nosubs') {
        const validationResult = await validateFreeTrip('zaptrip');
        setFreeTripStatus(validationResult);

        // Only show free trip dialog if user has used all 3 free trips
        if (validationResult.remaining === 0) {
          setShowFreeTripDialog(true);
          return;
        }
      }

      setOpen(true);
    } catch (error) {
      console.error('Error checking user role:', error);
      setOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {buttonVariant === "mobile" ? (
          <button 
            className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-full shadow-2xl hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 -mt-7 z-10 border-4 border-white"
            onClick={handleCreateTrip}
          >
            <PlusCircle className="w-7 h-7 text-white" />
          </button>
        ) : (
          <Button
            onClick={handleCreateTrip}
            className={cn(
              "relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            )}
          >
            <span className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              {t('form.createZap')}
            </span>
          </Button>
        )}
        <DialogContent 
          className={cn(
            // Base styles
            "bg-black/30 backdrop-blur-sm border shadow-lg rounded-xl overflow-hidden",
            "p-0 gap-0",
            
            // Dynamic width based on screen size
            "w-[98%] sm:w-[95%] md:w-[90%] lg:w-[85%] xl:w-[80%]",
            "max-w-6xl",
            
            // Dynamic height based on screen size and orientation
            isLandscape
              ? "h-[98vh] max-h-[98vh]" // Landscape mode
              : windowHeight < 700
                ? "h-[95vh] max-h-[95vh]" // Small screens
                : "h-[90vh] max-h-[90vh]", // Regular screens
            
            // Additional responsive adjustments
            "min-h-0",
            "flex flex-col"
          )}
        >
          <DialogTitle className="sr-only">{t('form.createZap')}</DialogTitle>
          <DialogDescription className="sr-only">{t('form.description')}</DialogDescription>
          
          {/* Scrollable content area */}
          <div className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent",
            "p-3 sm:p-4 md:p-6",
            "relative",
            // Additional padding for very small screens
            windowHeight < 600 && "p-2",
            // Adjust padding in landscape mode
            isLandscape && "p-2 sm:p-3"
          )}>
            <CreateTrip session={session} onTripCreated={() => setOpen(false)} />
          </div>

          {/* Close button - adjusted for better touch targets */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute z-50",
              "top-2 right-2",
              "h-8 w-8 sm:h-10 sm:w-10",
              "bg-black/20 hover:bg-black/40",
              "rounded-full",
              // Larger touch target on mobile
              "touch-action-manipulation",
              // Ensure visibility
              "text-white hover:text-white",
              // Safe area adjustments
              "safe-top safe-right"
            )}
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogContent>
      </Dialog>

      {/* Free Trip Dialog */}
      <FreeTripDialog
        isOpen={showFreeTripDialog}
        onClose={() => setShowFreeTripDialog(false)}
        onUpgrade={() => {
          setShowFreeTripDialog(false);
          setShowUpgradeModal(true);
        }}
        remaining={freeTripStatus?.remaining ?? null}
        nextReset={freeTripStatus?.next_reset ?? null}
        tripType="zaptrip"
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}