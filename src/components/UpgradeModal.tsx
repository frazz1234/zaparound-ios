import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Rocket, Stars } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { t } = useTranslation('pricing');
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-yellow-500" />
            {t('upgradeModal.title', 'Upgrade to Create More Trips')}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t('upgradeModal.description', 'You\'ve already used your free trip. Upgrade to a premium plan to create unlimited trips.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 p-1.5 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">{t('upgradeModal.benefit1Title', 'Unlimited Trip Creation')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('upgradeModal.benefit1Desc', 'Create as many trips as you need for all your adventures')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 p-1.5 rounded-full">
                <Stars className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">{t('upgradeModal.benefit2Title', 'Premium Features')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('upgradeModal.benefit2Desc', 'Access advanced tools like custom activities and special requests')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 p-1.5 rounded-full">
                <Rocket className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">{t('upgradeModal.benefit3Title', 'Priority Generation')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('upgradeModal.benefit3Desc', 'Get your trips generated faster with premium account priority')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-[#61936f] hover:text-[#4a7256] border-[#61936f] hover:bg-[#61936f]/10"
          >
            {t('upgradeModal.cancelButton', 'Maybe Later')}
          </Button>
          <Button 
            onClick={handleUpgrade}
            className={cn(
              "relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
            )}
          >
            {t('upgradeModal.upgradeButton', 'Upgrade Now')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 