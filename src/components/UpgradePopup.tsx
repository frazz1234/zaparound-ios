import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Sparkles, Lock } from "lucide-react";

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePopup({ isOpen, onClose }: UpgradePopupProps) {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            {t('upgradeToExplorer')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('unlockMapFeatures')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent/10">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm">{t('feature1')}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent/10">
            <Lock className="w-5 h-5 text-primary" />
            <span className="text-sm">{t('feature2')}</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="sm:w-[200px]"
          >
            {t('maybeLater')}
          </Button>
          <Button
            onClick={handleUpgradeClick}
            className="sm:w-[200px]"
          >
            {t('upgradeNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 