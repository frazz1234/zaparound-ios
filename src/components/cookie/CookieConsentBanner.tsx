import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { ConsentCategory } from '@/hooks/useCookieConsent';
import { useCookieConsentContext } from '@/providers/CookieConsentProvider';
import { X, Shield, Settings, Info } from 'lucide-react';

export function CookieConsentBanner() {
  const { t } = useTranslation('cookies');
  const {
    consentState,
    isOpen,
    acceptAll,
    acceptNecessary,
    updateCategoryConsent,
    savePreferences,
  } = useCookieConsentContext();
  
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [error, setError] = useState<string | null>(null);
  
  // Debug: Log banner state
  useEffect(() => {
    console.log('CookieConsentBanner state:', { isOpen, consentState });
  }, [isOpen, consentState]);

  // Handle consent operations with error handling
  const handleAcceptAll = async () => {
    try {
      await acceptAll();
    } catch (err) {
      console.error('Failed to accept all cookies:', err);
      setError(t('error.acceptAll'));
    }
  };

  const handleAcceptNecessary = async () => {
    try {
      await acceptNecessary();
    } catch (err) {
      console.error('Failed to accept necessary cookies:', err);
      setError(t('error.acceptNecessary'));
    }
  };

  const handleSavePreferences = async () => {
    try {
      await savePreferences();
    } catch (err) {
      console.error('Failed to save cookie preferences:', err);
      setError(t('error.savePreferences'));
    }
  };

  const handleUpdateCategory = async (category: ConsentCategory, checked: boolean) => {
    try {
      await updateCategoryConsent(category, checked);
    } catch (err) {
      console.error(`Failed to update ${category} consent:`, err);
      setError(t('error.updateCategory'));
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // If the user has already interacted with the consent banner before,
  // show the settings tab by default when reopening
  useEffect(() => {
    if (isOpen && consentState.hasInteracted) {
      setActiveTab('settings');
    }
  }, [isOpen, consentState.hasInteracted]);

  // Ensure banner is mounted even when not visible to prevent hydration issues
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 bg-background border-t shadow-lg cookie-consent-component"
        >
          {error && (
            <div className="absolute top-0 left-0 right-0 p-2 bg-destructive text-destructive-foreground text-center text-sm">
              {error}
            </div>
          )}
          
          <div className="container max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-xl font-semibold">{t('title')}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={acceptNecessary}
                aria-label={t('close')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">
                  <Info className="h-4 w-4 mr-2" />
                  {t('summary')}
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('settings')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="py-4">
                <p className="mb-4">
                  {t('summaryText')}
                </p>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t('privacyLink')}{' '}
                  <a href="/privacy" className="text-primary hover:underline">
                    {t('privacyPolicy')}
                  </a>
                  {' '}{t('and')}{' '}
                  <a href="/cookie-policy" className="text-primary hover:underline">
                    {t('cookiePolicy')}
                  </a>.
                </p>
              </TabsContent>
              
              <TabsContent value="settings" className="py-4">
                <div className="space-y-6">
                  <CookieCategory
                    id="necessary"
                    title={t('necessary.title')}
                    description={t('necessary.description')}
                    checked={consentState.necessary}
                    onChange={() => {}} // Can't be changed
                    disabled={true}
                  />
                  
                  <CookieCategory
                    id="functional"
                    title={t('functional.title')}
                    description={t('functional.description')}
                    checked={consentState.functional}
                    onChange={(checked) => handleUpdateCategory('functional', checked)}
                  />
                  
                  <CookieCategory
                    id="analytics"
                    title={t('analytics.title')}
                    description={t('analytics.description')}
                    checked={consentState.analytics}
                    onChange={(checked) => handleUpdateCategory('analytics', checked)}
                  />
                  
                  <CookieCategory
                    id="marketing"
                    title={t('marketing.title')}
                    description={t('marketing.description')}
                    checked={consentState.marketing}
                    onChange={(checked) => handleUpdateCategory('marketing', checked)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-end">
              <Button
                variant="outline"
                onClick={handleAcceptNecessary}
              >
                {t('acceptNecessary')}
              </Button>
              
              {activeTab === 'settings' && (
                <Button
                  variant="outline"
                  onClick={handleSavePreferences}
                >
                  {t('savePreferences')}
                </Button>
              )}
              
              <Button
                variant="default"
                onClick={handleAcceptAll}
              >
                {t('acceptAll')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CookieCategoryProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function CookieCategory({
  id,
  title,
  description,
  checked,
  onChange,
  disabled = false
}: CookieCategoryProps) {
  return (
    <div className="flex items-start justify-between space-x-4 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id={`cookie-${id}`}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label={title}
        />
        <Label htmlFor={`cookie-${id}`} className="sr-only">
          {title}
        </Label>
      </div>
    </div>
  );
} 