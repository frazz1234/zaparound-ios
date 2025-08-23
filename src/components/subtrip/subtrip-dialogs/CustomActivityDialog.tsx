import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CustomActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customActivity: string;
  onCustomActivityChange: (value: string) => void;
  onAddCustomActivity: () => void;
}

const CustomActivityDialog: React.FC<CustomActivityDialogProps> = ({
  isOpen,
  onOpenChange,
  customActivity,
  onCustomActivityChange,
  onAddCustomActivity
}) => {
  const { t } = useTranslation('home');
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md",
        "p-4 sm:p-6",
        "!rounded-2xl sm:!rounded-3xl",
        "w-[calc(100%-2rem)] sm:w-auto",
        "mx-4 sm:mx-auto"
      )}>
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl">{t('addActivity.title')}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t('addActivity.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="activity" className="text-right">
              {t('addActivity.activity')}
            </Label>
            <Input
              id="activity"
              value={customActivity}
              onChange={(e) => onCustomActivityChange(e.target.value)}
              className="col-span-3"
              placeholder={t('addActivity.enterActivity')}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className={cn(
              "w-full sm:w-auto order-2 sm:order-1",
              "min-h-[44px]",
              "active:scale-95 touch-manipulation"
            )}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={onAddCustomActivity}
            className={cn(
              "bg-[#61936f] hover:bg-[#4a7256] text-white",
              "w-full sm:w-auto order-1 sm:order-2",
              "min-h-[44px]",
              "active:scale-95 touch-manipulation"
            )}
            disabled={!customActivity.trim()}
          >
            {t('addActivity.addActivity')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomActivityDialog; 