import { CookieConsentState } from '@/hooks/useCookieConsent';
import { cookieMonitor } from './cookieMonitor';

interface CookieOptions {
  expires?: Date | number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  const cookieConsent = getConsentState();
  
  // Check if we have consent to set this cookie based on its name
  if (!shouldSetCookie(name, cookieConsent)) {
    console.warn(`Cookie "${name}" not set due to user consent preferences`);
    return;
  }
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (options.expires) {
    if (typeof options.expires === 'number') {
      const days = options.expires;
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      options.expires = date;
    }
    
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }
  
  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += '; path=/'; // Default to root path
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }
  
  if (options.secure) {
    cookieString += '; secure';
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  } else {
    cookieString += '; samesite=lax'; // Default to lax
  }

  // Check cookie size before setting
  const cookieSize = new Blob([cookieString]).size;
  if (cookieSize > 4096) { // 4KB limit per cookie
    console.error(`Cookie "${name}" exceeds size limit (${cookieSize} bytes)`);
    return;
  }
  
  document.cookie = cookieString;
  
  // Update cookie inventory after setting
  cookieMonitor.updateCookieAccess(name);
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  const cookieConsent = getConsentState();
  
  // Check if we have consent to read this cookie based on its name
  if (!shouldSetCookie(name, cookieConsent)) {
    console.warn(`Cookie "${name}" not read due to user consent preferences`);
    return null;
  }
  
  const cookies = document.cookie.split(';');
  const encodedName = encodeURIComponent(name);
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    
    if (cookie.indexOf(encodedName + '=') === 0) {
      // Update access time in inventory
      cookieMonitor.updateCookieAccess(name);
      return decodeURIComponent(cookie.substring(encodedName.length + 1));
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: Omit<CookieOptions, 'expires'> = {}) {
  // Set expiration to a past date to delete the cookie
  setCookie(name, '', { ...options, expires: new Date(0) });
}

/**
 * Get the current consent state from the document
 */
function getConsentState(): CookieConsentState {
  try {
    const consentAttr = document.documentElement.getAttribute('data-cookie-consent');
    if (consentAttr) {
      return JSON.parse(consentAttr) as CookieConsentState;
    }
  } catch (error) {
    console.error('Error parsing cookie consent state:', error);
  }
  
  // Default to only necessary cookies if consent state is not available
  return {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
    hasInteracted: false
  };
}

/**
 * Determine if a cookie should be set based on its name and the consent state
 */
function shouldSetCookie(name: string, consentState: CookieConsentState): boolean {
  // Always allow necessary cookies
  if (isNecessaryCookie(name)) {
    return true;
  }
  
  // Always allow GA4 cookies specifically
  if (isGoogleAnalyticsCookie(name)) {
    return true;
  }
  
  // Check other analytics cookies (non-GA4)
  if (isAnalyticsCookie(name) && !consentState.analytics) {
    return false;
  }
  
  // Check other categories
  if (isFunctionalCookie(name) && !consentState.functional) {
    return false;
  }
  
  if (isMarketingCookie(name) && !consentState.marketing) {
    return false;
  }
  
  // Default to allowing if not categorized (though this should be avoided)
  return true;
}

/**
 * Check if a cookie is a necessary cookie
 */
function isNecessaryCookie(name: string): boolean {
  const necessaryCookies = [
    'zaparound-cookie-consent',
    'session',
    'csrf',
    'auth',
    'sb-',  // Supabase cookies
  ];
  
  return necessaryCookies.some(prefix => name.startsWith(prefix));
}

/**
 * Check if a cookie is specifically from Google Analytics
 */
function isGoogleAnalyticsCookie(name: string): boolean {
  return name.startsWith('_ga'); // This covers _ga, _gid, _gat
}

/**
 * Check if a cookie is an analytics cookie
 */
function isAnalyticsCookie(name: string): boolean {
  const analyticsCookies = [
    'plausible_',
    'amplitude_',
    'mixpanel_',
  ];
  
  return analyticsCookies.some(prefix => name.startsWith(prefix)) || isGoogleAnalyticsCookie(name);
}

/**
 * Check if a cookie is a functional cookie
 */
function isFunctionalCookie(name: string): boolean {
  const functionalCookies = [
    'theme',
    'language',
    'app-language',
    'preferences',
    'ui-',
  ];
  
  return functionalCookies.some(prefix => name.startsWith(prefix));
}

/**
 * Check if a cookie is a marketing cookie
 */
function isMarketingCookie(name: string): boolean {
  const marketingCookies = [
    '_fbp',
    '_gcl',
    'ads_',
    'marketing_',
  ];
  
  return marketingCookies.some(prefix => name.startsWith(prefix));
} 