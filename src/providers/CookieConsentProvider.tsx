import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useCookieConsent, CookieConsentState, ConsentCategory } from '@/hooks/useCookieConsent';
import { CookieConsentBanner } from '@/components/cookie/CookieConsentBanner';

interface CookieConsentContextType {
  consentState: CookieConsentState;
  isOpen: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  updateCategoryConsent: (category: ConsentCategory, value: boolean) => void;
  savePreferences: () => void;
  openSettings: () => void;
  hasConsent: (category: ConsentCategory) => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const cookieConsent = useCookieConsent();
  
  // Helper function to check if a specific category has consent
  const hasConsent = (category: ConsentCategory): boolean => {
    return cookieConsent.consentState[category];
  };

  const value: CookieConsentContextType = {
    ...cookieConsent,
    hasConsent,
  };
  
  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <CookieConsentBanner />
    </CookieConsentContext.Provider>
  );
}

export const useCookieConsentContext = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
}; 