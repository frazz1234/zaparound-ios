import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface EmailBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
}

export function EmailBookingDialog({ isOpen, onClose, bookingData }: EmailBookingDialogProps) {
  const { t, i18n } = useTranslation('zapbooking');
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: t('error'),
        description: t('emailDialog.pleaseEnterValidEmail'),
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: t('error'),
        description: t('emailDialog.pleaseEnterValidEmail'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-booking-email', {
        body: {
          bookingReference: bookingData.booking_reference,
          recipientEmail: email.trim(),
          bookingData: bookingData,
          language: i18n.language
        }
      });

      if (error) throw error;

      toast({
        title: t('emailDialog.success'),
        description: t('emailDialog.bookingDetailsSent'),
      });

      setEmail('');
      onClose();
    } catch (error: any) {
      console.error('Error sending booking email:', error);
      toast({
        title: t('error'),
        description: error.message || t('emailDialog.failedToSend'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            {t('emailDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('emailDialog.description')} {bookingData?.booking_reference}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('emailDialog.emailAddress')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailDialog.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('emailDialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="bg-[#61936f] hover:bg-[#4a7c5a] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('emailDialog.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('emailDialog.sendEmail')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 