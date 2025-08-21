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
 * Get consent state - now always returns all permissions granted
 */
function getConsentState(): CookieConsentState {
  // Always return full consent since cookies are automatically accepted
  return {
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true,
    hasInteracted: true
  };
}

/**
 * Check if we should set a cookie - now always returns true
 */
function shouldSetCookie(name: string, consentState: CookieConsentState): boolean {
  // Always allow cookies since consent is automatic
  return true;
}

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  // Always allow setting cookies since consent is automatic
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
  // Always allow reading cookies since consent is automatic
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