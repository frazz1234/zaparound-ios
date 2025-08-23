import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface ResendVerificationFormProps {
  onClose?: () => void;
}

export function ResendVerificationForm({ onClose }: ResendVerificationFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number | null>(null);

  // Check if there's a cooldown from a previous attempt
  useEffect(() => {
    const storedTime = localStorage.getItem('lastVerificationAttempt');
    if (storedTime) {
      const lastTime = parseInt(storedTime, 10);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTime) / 1000);
      
      if (elapsedSeconds < 60) { // 1 minute cooldown
        setCooldown(60 - elapsedSeconds);
        setLastAttemptTime(lastTime);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccess(false);

    // Check if we're still in cooldown
    if (cooldown > 0) {
      setErrorMessage(t('errors.tooManyAttempts'));
      setLoading(false);
      return;
    }

    // Check if captcha is completed
    if (!captchaToken) {
      setErrorMessage(t('validation.captchaRequired'));
      setLoading(false);
      return;
    }

    try {
      // Validate email format
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setErrorMessage(t('validation.emailInvalid'));
        setLoading(false);
        return;
      }

      // Call Supabase to resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          captchaToken
        }
      });

      if (error) {
        if (error.message.includes('captcha')) {
          setErrorMessage(t('errors.captchaFailed'));
        } else {
          setErrorMessage(error.message);
        }
        throw error;
      }

      // Set cooldown
      const now = Date.now();
      localStorage.setItem('lastVerificationAttempt', now.toString());
      setLastAttemptTime(now);
      setCooldown(60); // 1 minute cooldown

      setSuccess(true);
      toast({
        title: t('success.signUp'),
        description: t('resendVerification.success')
      });

      // Close the dialog after 3 seconds if onClose is provided
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      if (!errorMessage) {
        toast({
          title: t('errors.default'),
          description: error.message || t('errors.default'),
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaChange = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <form onSubmit={handleResendVerification} className="space-y-4">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="text-sm">{errorMessage}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
          <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            {t('resendVerification.success')}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('resendVerification.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('resendVerification.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || success || cooldown > 0}
        />
      </div>
      
      <div className="flex justify-center my-4">
        <div className="captcha-container">
          <HCaptcha
            sitekey="17f0e2fe-5b64-45c0-8950-8856adb63412" // Use Supabase public dev sitekey or your own
            onVerify={handleCaptchaChange}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>
      </div>
      
      {cooldown > 0 && (
        <div className="text-sm text-amber-600 text-center">
          {t('resendVerification.cooldownMessage', { seconds: cooldown })}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={loading || success || cooldown > 0}
        variant="default"
      >
        {loading 
          ? t('loading')
          : cooldown > 0
            ? `${t('resendVerification.waitingCooldown')} (${cooldown}s)`
            : t('resendVerification.button')}
      </Button>
    </form>
  );
} 