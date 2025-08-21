import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';

interface TripDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripTitle: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const TripDeleteDialog = ({ 
  open, 
  onOpenChange, 
  tripTitle, 
  onConfirm,
  isDeleting = false
}: TripDeleteDialogProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {t('trip.deletion.confirmQuestion')}
          </DialogTitle>
          <DialogDescription>
            {t('trip.deletion.confirmDescription')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('trip.deletion.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? t('trip.deletion.deleting') : t('trip.deletion.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
