import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const { toast } = useToast();
  const { t, i18n } = useTranslation('auth');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidRecoverySession, setIsValidRecoverySession] = useState(false);

  useEffect(() => {
    // Set the language based on the URL parameter
    if (lang && lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }

    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Handle the recovery token from Supabase
    const handleRecoveryToken = async () => {
      try {
        // Check if we're coming from a Supabase recovery email
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const searchParams = new URLSearchParams(location.search);
        
        // Supabase sends tokens in different ways depending on the redirect
        const accessToken = hashParams.get('access_token') || searchParams.get('token');
        const type = hashParams.get('type') || searchParams.get('type');
        
        if (type === 'recovery' && accessToken) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(accessToken);
          
          if (error) {
            throw error;
          }
          
          // Check if we have a valid recovery session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setIsValidRecoverySession(true);
            setVerifying(false);
          } else {
            throw new Error('No valid session found');
          }
        } else {
          // Check if user already has a recovery session
          const { data: { session } } = await supabase.auth.getSession();
          
          // Check if this is a recovery session by looking at the session metadata
          if (session?.user?.recovery_sent_at) {
            setIsValidRecoverySession(true);
            setVerifying(false);
          } else {
            throw new Error('Invalid or expired reset link');
          }
        }
      } catch (error) {
        console.error('Reset password verification error:', error);
        toast({
          title: t('errors.default'),
          description: t('resetPassword.invalidResetLink'),
          variant: "destructive",
        });
        // Clear any invalid hash/search params and redirect to auth
        navigate(`/${lang || i18n.language}/auth`, { replace: true });
      }
    };
    
    handleRecoveryToken();
  }, [navigate, toast, t, lang, i18n, location]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setErrorMessage(t('resetPassword.passwordsDoNotMatch'));
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMessage(t('resetPassword.passwordTooShort'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      toast({
        title: t('resetPassword.passwordUpdated'),
        description: t('resetPassword.passwordUpdateSuccess'),
      });
      
      // Sign out the user to clear the recovery session
      await supabase.auth.signOut();
      
      // Redirect to auth page after successful password reset
      setTimeout(() => {
        navigate(`/${lang || i18n.language}/auth`);
      }, 1000);
      
    } catch (error: any) {
      toast({
        title: t('errors.default'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('resetPassword.verifyingLink')}</p>
        </div>
      </div>
    );
  }

  if (!isValidRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center font-bold text-red-600">
              {t('errors.default')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('resetPassword.invalidResetLink')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate(`/${lang || i18n.language}/auth`)}>
              {t('auth.goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img
              src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWhzNGQ2MnpndHNqeGthM2xqOWpwNTBkOG1wdHNvMjk2Yzg4enJmNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LMQ9c65BnD2gzMiJWg/giphy.gif"
              alt="ZapAround Logo"
              className="h-12"
            />
          </div>
          <CardTitle className="text-2xl text-center font-bold">
            {t('resetPassword.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('resetPassword.enterNewPassword')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('resetPassword.newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('resetPassword.passwordPlaceholder')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('resetPassword.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('resetPassword.passwordPlaceholder')}
                required
              />
            </div>
            
            {errorMessage && (
              <div className="text-red-500 text-sm mt-2">
                {errorMessage}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? t('resetPassword.updating')
                : t('resetPassword.updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
