import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation('auth');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!captchaToken && showCaptcha) {
        toast({
          title: t('errors.default'),
          description: t('validation.captchaRequired'),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const baseUrl = 'https://zaparound.com';
      const redirectTo = `${baseUrl}/${i18n.language}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
        captchaToken: captchaToken || undefined,
      });
      
      if (error) {
        if (error.message.includes('captcha')) {
          setShowCaptcha(true);
          throw new Error(t('errors.captchaFailed'));
        }
        throw error;
      }
      
      toast({
        title: t('success.resetPassword'),
        description: t('resetPassword.subtitle')
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      toast({
        title: t('errors.default'),
        description: error.message || t('resetPassword.generalMessage'),
        variant: "destructive",
      });
      
      if (!error.message.includes('captcha')) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaChange = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor="reset-email">{t('resetPassword.email')}</Label>
        <Input
          id="reset-email"
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder={t('resetPassword.emailPlaceholder')}
          required
        />
      </div>
      
      {showCaptcha && (
        <div className="flex justify-center my-4">
          <div className="captcha-container">
            <HCaptcha
              sitekey="17f0e2fe-5b64-45c0-8950-8856adb63412"
              onVerify={handleCaptchaChange}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('resetPassword.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading ? t('loading') : t('resetPassword.button')}
        </Button>
      </div>
    </form>
  );
}
