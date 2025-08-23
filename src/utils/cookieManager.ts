
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





 