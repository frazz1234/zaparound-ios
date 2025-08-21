import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/LanguageSelector";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { AppleSignIn } from "@/components/auth/AppleSignIn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  // Temporarily hidden Apple authentication
  // const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resendVerificationOpen, setResendVerificationOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Extract returnTo and plan from location state
  const returnTo = location.state?.returnTo || '/dashboard';
  const plan = location.state?.plan || null;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Check if this is the callback route
    if (window.location.pathname.includes('/auth/callback')) {
      handleAuthCallback();
    } else {
      checkUser();
      // Temporarily hidden Apple authentication
      // detectAppleDevice();
    }

    // Check if we should show signup tab directly
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setAuthMode('signup');
    }
  }, [location]);

  // Temporarily hidden Apple device detection
  /*
  const detectAppleDevice = () => {
    // Detect if the user is on an Apple device (iOS or macOS)
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isMac = /Mac/.test(userAgent) && !(/iPhone|iPad|iPod/.test(userAgent));
    setIsAppleDevice(isIOS || isMac);
  };
  */

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // If user is already logged in, redirect to returnTo path
        handleRedirectAfterAuth(user.id);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleAuthCallback = async () => {
    try {
      console.log("Auth - Handling auth callback");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("Auth - Session found in callback");
        // Check if this is an Apple sign-in
        const queryParams = new URLSearchParams(window.location.search);
        const isNewSignUp = queryParams.get('isNewSignUp') === 'true';
        
        if (isNewSignUp && session.user?.app_metadata?.provider === 'apple') {
          console.log("Auth - Detected Apple sign-in, redirecting to root with isNewSignUp");
          // Redirect to root with isNewSignUp parameter
          window.location.href = '/?isNewSignUp=true';
        } else {
          console.log("Auth - Regular sign-in, redirecting appropriately");
          handleRedirectAfterAuth(session.user.id);
        }
      } else {
        console.log("Auth - No session in callback, redirecting to auth");
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error handling auth callback:', error);
      navigate('/auth');
    }
  };

  const handleRedirectAfterAuth = async (userId: string) => {
    try {
      // Force refresh localStorage cache by removing it first
      localStorage.removeItem('userRole');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRoleTimestamp');
      
      // Check the user's role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching user role:", error);
        const currentLang = lang || 'en';
        navigate(`/${currentLang}/dashboard`);
        return;
      }
      
      // Cache the role in localStorage immediately
      const role = data?.role || 'nosubs';
      localStorage.setItem('userRole', role);
      localStorage.setItem('isAdmin', 'false');
      localStorage.setItem('userRoleTimestamp', Date.now().toString());

      // If user has a pending free trip state, redirect to homepage to restore it
      if (localStorage.getItem('zaparound_free_trip_state')) {
        navigate('/', { replace: true });
        return;
      }
      
      // Handle different redirect scenarios
      const currentLang = lang || 'en';
      
      // If user has 'nosubs' role and came from pricing with plan selection, 
      // redirect back to pricing with the plan
      if (role === 'nosubs' && returnTo === '/pricing' && plan) {
        navigate(`/${currentLang}/pricing`, { state: { selectedPlan: plan } });
      } else if (returnTo && returnTo !== '/dashboard') {
        // If there's a specific returnTo path (like booking pages), honor it
        // Make sure the path includes the language prefix
        const redirectPath = returnTo.startsWith(`/${currentLang}`) ? returnTo : `/${currentLang}${returnTo}`;
        navigate(redirectPath);
      } else if (role === 'nosubs') {
        // For nosubs users, redirect to dashboard
        navigate(`/${currentLang}/dashboard`);
      } else {
        // Otherwise, redirect to dashboard
        navigate(`/${currentLang}/dashboard`);
      }
    } catch (error) {
      console.error("Error in handleRedirectAfterAuth:", error);
      const currentLang = lang || 'en';
      navigate(`/${currentLang}/dashboard`);
    }
  };

  const handleAuthSuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      handleRedirectAfterAuth(user.id);
    } else {
      const currentLang = lang || 'en';
      navigate(`/${currentLang}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img
              src="/zaparound-uploads/transparentnoliner.webp"
              alt="ZapAround Logo"
              className="h-12"
            />
          </div>
          <CardTitle className="text-2xl text-center font-bold">
            {authMode === 'signin' ? t('signIn.title') : t('signUp.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {authMode === 'signin' 
              ? t('signIn.subtitle') 
              : t('signUp.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue={authMode} 
            value={authMode} 
            onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger id="signin-tab" value="signin">{t('signIn.button')}</TabsTrigger>
              <TabsTrigger id="signup-tab" value="signup">{t('signUp.button')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onForgotPassword={() => setResetPasswordOpen(true)}
                onSuccess={handleAuthSuccess}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                onSuccess={handleAuthSuccess}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center justify-between gap-2 mt-4">
            <LanguageSelector variant="ghost" />
          </div>
          
          {/* Temporarily hidden Apple Sign In
          {isAppleDevice && (
            <>
              <div className="relative my-4">
                <Separator className="absolute inset-0 flex items-center" />
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('auth.continueWith') || "Or continue with"}
                  </span>
                </div>
              </div>
              
              <AppleSignIn />
            </>
          )}
          */}
        </CardContent>
      </Card>
      
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('resetPassword.title')}</DialogTitle>
            <DialogDescription>
              {t('resetPassword.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <ResetPasswordForm onSuccess={() => setResetPasswordOpen(false)} />
        </DialogContent>
      </Dialog>
      

    </div>
  );
}
