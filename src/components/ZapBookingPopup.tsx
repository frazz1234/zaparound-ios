import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ZapBookingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ZapBookingPopup({ isOpen, onClose }: ZapBookingPopupProps) {
  const { t } = useTranslation('zapbooking');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto p-6 rounded-3xl border-2 border-[#eaeaea] bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center mb-4">
            {t('comingSoon')}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🚀</div>
          <p className="text-gray-600">
            {t('comingSoonMessage')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 