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

// Default consent state (all cookies allowed by default)
const defaultConsentState: CookieConsentState = {
  necessary: true, // Always true, cannot be disabled
  functional: true, // Auto-accept functional cookies
  analytics: true,  // Auto-accept analytics cookies
  marketing: true,  // Auto-accept marketing cookies
  hasInteracted: true // Mark as already interacted
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
  const [isOpen, setIsOpen] = useState(false); // Always false - no banner shown

  // Load consent state from cookie on mount and auto-accept all cookies
  useEffect(() => {
    const savedConsent = getCookie(CONSENT_COOKIE_NAME);
    
    if (savedConsent) {
      try {
        const parsedConsent = JSON.parse(savedConsent) as CookieConsentState;
        // Always ensure all cookies are accepted
        const updatedConsent = {
          ...parsedConsent,
          necessary: true,
          functional: true,
          analytics: true,
          marketing: true,
          hasInteracted: true
        };
        setConsentState(updatedConsent);
        
        // Apply the updated consent settings
        applyConsentSettings(updatedConsent);
        
        // Save the updated consent
        setCookie(
          CONSENT_COOKIE_NAME, 
          JSON.stringify(updatedConsent), 
          CONSENT_COOKIE_OPTIONS
        );
      } catch (e) {
        console.error('Error parsing consent cookie:', e);
        // Set default state with all cookies accepted
        setConsentState(defaultConsentState);
        applyConsentSettings(defaultConsentState);
        setCookie(
          CONSENT_COOKIE_NAME, 
          JSON.stringify(defaultConsentState), 
          CONSENT_COOKIE_OPTIONS
        );
      }
    } else {
      // No consent has been saved, auto-accept all cookies
      setConsentState(defaultConsentState);
      applyConsentSettings(defaultConsentState);
      setCookie(
        CONSENT_COOKIE_NAME, 
        JSON.stringify(defaultConsentState), 
        CONSENT_COOKIE_OPTIONS
      );
    }
  }, []);

  // Function to apply consent settings to actual cookies/tracking systems
  const applyConsentSettings = (settings: CookieConsentState) => {
    // Set a data attribute on the document for easy access in other scripts
    document.documentElement.setAttribute('data-cookie-consent', JSON.stringify(settings));
    
    // Update Google Analytics consent using our service
    analytics.updateConsent({
      analytics: true, // Always enable analytics
      marketing: true  // Always enable marketing
    });
  };

  // Accept all cookies (always true now)
  const acceptAll = () => {
    const newState = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      hasInteracted: true
    };
    setConsentState(newState);
    setIsOpen(false);
    applyConsentSettings(newState);
    setCookie(
      CONSENT_COOKIE_NAME, 
      JSON.stringify(newState), 
      CONSENT_COOKIE_OPTIONS
    );
  };

  // Accept only necessary cookies (now accepts all)
  const acceptNecessary = () => {
    const newState = {
      ...defaultConsentState,
      hasInteracted: true
    };
    setConsentState(newState);
    setIsOpen(false);
    applyConsentSettings(newState);
    setCookie(
      CONSENT_COOKIE_NAME, 
      JSON.stringify(newState), 
      CONSENT_COOKIE_OPTIONS
    );
  };

  // Update a specific category (always sets to true)
  const updateCategoryConsent = (category: ConsentCategory, value: boolean) => {
    const newState = {
      ...consentState,
      [category]: true, // Always set to true regardless of input
    };
    setConsentState(newState);
    applyConsentSettings(newState);
  };

  // Save custom preferences (always saves with all true)
  const savePreferences = () => {
    const newState = {
      ...consentState,
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      hasInteracted: true
    };
    setConsentState(newState);
    setIsOpen(false);
    applyConsentSettings(newState);
    setCookie(
      CONSENT_COOKIE_NAME, 
      JSON.stringify(newState), 
      CONSENT_COOKIE_OPTIONS
    );
  };

  // Open the cookie settings modal/banner (does nothing now)
  const openSettings = () => {
    // Do nothing - no settings to open
    console.log('Cookie settings disabled - all cookies automatically accepted');
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