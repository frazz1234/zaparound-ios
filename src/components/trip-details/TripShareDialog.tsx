import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Check, Copy } from 'lucide-react';

interface TripShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
}

export const TripShareDialog: React.FC<TripShareDialogProps> = ({ open, onOpenChange, shareUrl }) => {
  const { t } = useTranslation('trip');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#fcfcfc] text-[#030303]">
        <DialogHeader>
          <DialogTitle className="text-[#1d1d1e]">{t('share.modalTitle')}</DialogTitle>
          <DialogDescription className="mb-4 text-[#62626a]">
            {t('share.modalDescription')}
          </DialogDescription>
        </DialogHeader>
        {/* Illustration placeholder */}
        <div className="flex justify-center mb-4">
          <img
            src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTB2emJubXp6NXliZHByeTJzcDZ3ODRremM4eWVmdWhycGliN2gwcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/as1VjJtNpvD7kxbuBM/giphy.gif"
            alt={t('share.imageAlt')}
            className="w-32 h-32 object-contain"
            style={{ background: '#61936f', borderRadius: '1rem' }}
          />
        </div>
        <div className="mb-2">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full border-[#61936f] text-[#61936f] hover:bg-[#e6f4ec] flex items-center justify-center"
            onClick={handleCopy}
            aria-label={t('share.copyButton')}
          >
            {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
            {copied ? t('share.copied') : t('share.copyButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 