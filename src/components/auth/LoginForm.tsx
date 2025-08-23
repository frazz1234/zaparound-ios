import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  onForgotPassword,
  onSuccess,
  errorMessage,
  setErrorMessage
}: LoginFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation('auth');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (showCaptcha && !captchaToken) {
        setErrorMessage(t('validation.captchaRequired'));
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken: captchaToken || undefined
        }
      });
      
      if (error) {
        console.error('Authentication error:', error.message);
        
        if (error.message.includes('captcha')) {
          setShowCaptcha(true);
          setErrorMessage(t('errors.captchaFailed'));
          return;
        }
        
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage(t('errors.invalidCredentials'));
        } else {
          setErrorMessage(error.message);
        }
        return;
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: t('errors.default'),
        description: errorMessage || error.message || t('errors.default'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaChange = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p>{errorMessage}</p>
            {errorMessage === t('errors.invalidCredentials') && (
              <p className="mt-1">
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="text-blue-600 hover:underline"
                >
                  {t('signIn.forgotPassword')}
                </button>
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('signIn.email')}</Label>
        <Input
          id="email"
          type="email"
          name="username"
          autoComplete="username"
          placeholder={t('signIn.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('signIn.password')}</Label>
        <Input
          id="password"
          type="password"
          name="current-password"
          autoComplete="current-password"
          placeholder={t('signIn.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
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
      
      <div className="text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-blue-600 hover:underline"
        >
          {t('signIn.forgotPassword')}
        </button>
      </div>
      
      <Button 
        type="submit" 
        className="w-full relative px-6 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white border-none hover:from-[#059669] hover:to-[#047857] hover:scale-105 transition-all duration-300 shadow-lg rounded-full font-medium tracking-wide"
        disabled={loading}
        variant="default"
      >
        {loading ? t('loading') : t('signIn.button')}
      </Button>
    </form>
  );
}
