import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import {
  PopoverForm,
  PopoverFormSuccess,
} from "@/components/ui/popover-form";
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LanguageSelectorProps {
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export function LanguageSelector({ variant = "ghost", className = "" }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation('languageSelector');
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (i18n.language === newLanguage) {
      setOpen(false);
      return;
    }
    
    setSelectedLanguage(newLanguage);
    setShowSuccess(true);
    
    try {
      // Change the language
      await i18n.changeLanguage(newLanguage);

      // Persist to user profile if logged in
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase
            .from('profiles')
            .update({ language: newLanguage })
            .eq('id', user.id);
          // Update local cache to align with App.tsx behavior
          localStorage.setItem('user_language', newLanguage);
          localStorage.setItem('user_language_timestamp', Date.now().toString());
        }
      } catch (dbError) {
        console.error('Error updating language in profile:', dbError);
      }
      
      // Update URL with new language
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const isLanguageInPath = SUPPORTED_LANGUAGES.includes(pathSegments[0]);
      
      if (isLanguageInPath) {
        // Replace the language segment in the URL
        pathSegments[0] = newLanguage;
        const newPath = '/' + pathSegments.join('/');
        navigate(newPath, { replace: true });
      } else {
        // Add language to the URL
        const newPath = `/${newLanguage}${location.pathname}`;
        navigate(newPath, { replace: true });
      }
      
      // Auto-close after success
      setTimeout(() => {
        setOpen(false);
        setShowSuccess(false);
        setSelectedLanguage(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error changing language:', error);
      toast({
        title: t('error'),
        description: t('errorDescription'),
        variant: "destructive",
        duration: 3000,
      });
      setShowSuccess(false);
      setSelectedLanguage(null);
    }
  };

  // Language display names and flags
  const languageData: Record<string, { name: string; flag: string }> = {
    en: { name: 'English', flag: '🇺🇸' },
    fr: { name: 'Français', flag: '🇫🇷' },
    es: { name: 'Español', flag: '🇪🇸' }
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <PopoverForm
      title="Select Language"
      open={open}
      setOpen={setOpen}
      width="280px"
      height="auto"
      showCloseButton={!showSuccess}
      showSuccess={showSuccess}
      trigger={
        <Button
          variant={variant}
          size="icon"
          className={className}
          onClick={() => setOpen(true)}
        >
          <Globe className="h-5 w-5" />
        </Button>
      }
      openChild={
        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-600 mb-4">
            Choose your preferred language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isCurrent = lang === currentLanguage;
            const languageInfo = languageData[lang];
            
            return (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  isCurrent 
                    ? 'border-[#61936f] bg-[#61936f]/5 text-[#61936f]' 
                    : 'border-gray-200 hover:border-[#61936f]/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{languageInfo.flag}</span>
                  <span className="font-medium">{languageInfo.name}</span>
                </div>
                {isCurrent && (
                  <Check className="h-4 w-4 text-[#61936f]" />
                )}
              </button>
            );
          })}
        </div>
      }
      successChild={
        <PopoverFormSuccess
          title="Language Changed"
          description={`Switched to ${selectedLanguage ? languageData[selectedLanguage]?.name : 'selected language'}`}
        />
      }
    />
  );
}
