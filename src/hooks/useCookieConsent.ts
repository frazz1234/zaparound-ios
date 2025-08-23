import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookie, setCookie } from '@/utils/cookieManager';
import { analytics } from '@/services/analytics';

// Define cookie consent categories
export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface CookieConsentState {
  necessary: boolean; // Always true, can't be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  hasInteracted: boolean; // Whether the user has made a choice
}

// Default consent state (only necessary cookies allowed)
const defaultConsentState: CookieConsentState = {
  necessary: true, // Always true, cannot be disabled
  functional: false,
  analytics: false,
  marketing: false,
  hasInteracted: false
};

// Cookie name for storing consent
const CONSENT_COOKIE_NAME = 'cookie_consent';

// Cookie options
const CONSENT_COOKIE_OPTIONS = {
  expires: 365, // 1 year
  path: '/',
  sameSite: 'strict' as const,
  secure: true
};

export function useCookieConsent() {
  const { t } = useTranslation();
  const [consentState, setConsentState] = useState<CookieConsentState>(defaultConsentState);
  const [isOpen, setIsOpen] = useState(false);

  // Load consent state from cookie on mount
  useEffect(() => {
    const savedConsent = getCookie(CONSENT_COOKIE_NAME);
    
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent) as CookieConsentState;
        setConsentState(parsedConsent);
        
        // Apply the loaded consent settings
        applyConsentSettings(parsedConsent);
      } catch (e) {
        console.error('Error parsing consent cookie:', e);
        setIsOpen(true);
      }
    } else {
      // No consent has been saved, show the banner
      setIsOpen(true);
    }
  }, []);

  // Save consent state to cookie whenever it changes
  useEffect(() => {
    if (consentState.hasInteracted) {
      setCookie(
        CONSENT_COOKIE_NAME, 
        JSON.stringify(consentState), 
        CONSENT_COOKIE_OPTIONS
      );
      
      // Apply the consent settings
      applyConsentSettings(consentState);
    }
  }, [consentState]);

  // Function to apply consent settings to actual cookies/tracking systems
  const applyConsentSettings = (settings: CookieConsentState) => {
    // Set a data attribute on the document for easy access in other scripts
    document.documentElement.setAttribute('data-cookie-consent', JSON.stringify(settings));
    
    // Update Google Analytics consent using our service
    analytics.updateConsent({
      analytics: settings.analytics,
      marketing: settings.marketing
    });
  };

  // Accept all cookies
  const acceptAll = () => {
    setConsentState({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      hasInteracted: true
    });
    setIsOpen(false);
  };

  // Accept only necessary cookies
  const acceptNecessary = () => {
    setConsentState({
      ...defaultConsentState,
      hasInteracted: true
    });
    setIsOpen(false);
  };

  // Update a specific category
  const updateCategoryConsent = (category: ConsentCategory, value: boolean) => {
    setConsentState(prev => ({
      ...prev,
      [category]: category === 'necessary' ? true : value, // Necessary cookies can't be disabled
    }));
  };

  // Save custom preferences
  const savePreferences = () => {
    setConsentState(prev => ({
      ...prev,
      hasInteracted: true
    }));
    setIsOpen(false);
  };

  // Open the cookie settings modal/banner
  const openSettings = () => {
    // Set isOpen first to ensure the dialog appears
    setIsOpen(true);
    
    // If there's no saved consent state, initialize with default
    if (!consentState.hasInteracted) {
      setConsentState({
        ...defaultConsentState,
        necessary: true // Always keep necessary cookies enabled
      });
    }
  };

  return {
    consentState,
    isOpen,
    setIsOpen,
    acceptAll,
    acceptNecessary,
    updateCategoryConsent,
    savePreferences,
    openSettings,
  };
}

// Add TypeScript global declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, config: any) => void;
  }
} 