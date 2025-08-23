import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useTranslation } from 'react-i18next';
import { ResetPasswordForm } from './ResetPasswordForm';
import { Users, Heart, Sparkles, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  defaultTab?: 'signin' | 'signup';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  defaultTab = 'signin'
}: AuthModalProps) {
  const { t } = useTranslation('auth');
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuthSuccess = () => {
    // Reset form state
    setEmail('');
    setPassword('');
    setErrorMessage('');
    setShowForgotPassword(false);
    
    // Call the onSuccess callback
    onSuccess();
    
    // Close the modal
    onClose();
  };
  
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };
  
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail('');
      setPassword('');
      setErrorMessage('');
      setShowForgotPassword(false);
      onClose();
    }
  };

  const fadeAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
      <DialogContent 
        className="z-[110] sm:max-w-[425px] bg-white max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Allow interactions with reCAPTCHA elements
          const target = e.target as HTMLElement;
          const isRecaptchaClick = 
            target.closest('iframe[src*="recaptcha"]') ||
            target.closest('div[style*="z-index: 2000000000"]') ||
            target.closest('.grecaptcha-badge') ||
            target.closest('[title*="recaptcha"]');
          
          if (!isRecaptchaClick) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-4">
          <DialogTitle className="sr-only">
            {activeTab === 'signup' ? t('signUp.title') : t('signIn.title')}
          </DialogTitle>
          {activeTab === 'signup' && !showForgotPassword && (
            <motion.div 
              className="flex flex-col items-center text-center space-y-3"
              {...fadeAnimation}
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-[#61936f]/10 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-8 h-8 text-[#61936f]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1e] flex items-center gap-2">
                {title || t('signUp.title')}
                <Heart className="w-5 h-5 text-[#61936f] animate-bounce" />
              </h2>
              <p className="text-[#62626a] max-w-sm">
                {description || t('signUp.subtitle')}
              </p>
              <div className="flex items-center gap-3 text-sm text-[#62626a]">
                <div className="flex items-center gap-1">
                  <Globe2 className="w-4 h-4" />
                  <span>{t('signUp.features.globalCommunity')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('signUp.features.amazingAdventures')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </DialogHeader>
        
        {showForgotPassword ? (
          <ResetPasswordForm 
            onSuccess={handleAuthSuccess}
          />
        ) : (
          <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 z-[111]">
              <TabsTrigger 
                id="signin-tab" 
                value="signin"
                className="data-[state=active]:bg-white data-[state=active]:text-[#1d1d1e]"
              >
                {t('signIn.title')}
              </TabsTrigger>
              <TabsTrigger 
                id="signup-tab" 
                value="signup"
                className="data-[state=active]:bg-white data-[state=active]:text-[#1d1d1e]"
              >
                {t('signUp.title')}
              </TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="z-[112]"
              >
                <TabsContent value="signin" className="mt-4">
                  <LoginForm
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    onForgotPassword={handleForgotPassword}
                    onSuccess={handleAuthSuccess}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                  />
                </TabsContent>
                
                <TabsContent value="signup" className="mt-4">
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
              </motion.div>
            </AnimatePresence>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 