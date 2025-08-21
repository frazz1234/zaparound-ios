import { getCookie, deleteCookie } from './cookieManager';

// Browser cookie limits (in bytes)
const COOKIE_LIMITS = {
  TOTAL_SIZE: 4096, // 4KB per cookie
  TOTAL_NUMBER: 50, // Maximum number of cookies per domain
  DOMAIN_SIZE: 4096 * 50, // Total size for all cookies per domain
  UPDATE_THROTTLE: 1000, // Minimum time between updates in ms
  DEBOUNCE_DELAY: 300, // Debounce delay for rapid updates
};

// Cookie inventory to track all cookies
interface CookieInfo {
  name: string;
  size: number;
  expires?: Date;
  category: 'necessary' | 'functional' | 'analytics' | 'marketing';
  lastAccessed: Date;
}

class CookieMonitor {
  private cookieInventory: Map<string, CookieInfo> = new Map();
  private static instance: CookieMonitor;
  private lastUpdateTime: number = 0;
  private updateTimeout: NodeJS.Timeout | null = null;
  private cachedTotalSize: number | null = null;
  private cachedCategoryCounts: Record<CookieInfo['category'], number> | null = null;

  private constructor() {
    // Initialize the cookie inventory
    this.updateInventory();
    
    // Set up periodic cleanup and monitoring
    setInterval(() => {
      this.cleanupExpiredCookies();
      this.checkCookieLimits();
    }, 1000 * 60 * 60); // Run every hour

    // Listen for cookie changes
    document.addEventListener('cookie-changed', this.debouncedUpdate);
  }

  private debouncedUpdate = () => {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = setTimeout(() => {
      this.updateInventory();
    }, COOKIE_LIMITS.DEBOUNCE_DELAY);
  };

  public static getInstance(): CookieMonitor {
    if (!CookieMonitor.instance) {
      CookieMonitor.instance = new CookieMonitor();
    }
    return CookieMonitor.instance;
  }

  // Update the cookie inventory
  private updateInventory(): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < COOKIE_LIMITS.UPDATE_THROTTLE) {
      return; // Skip update if too soon
    }
    this.lastUpdateTime = now;

    try {
      const cookies = document.cookie.split(';');
      const newInventory = new Map<string, CookieInfo>();
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        const decodedName = decodeURIComponent(name);
        const decodedValue = decodeURIComponent(value);
        
        // Reuse existing cookie info if available
        const existingInfo = this.cookieInventory.get(decodedName);
        const cookieInfo: CookieInfo = {
          name: decodedName,
          size: new Blob([cookie]).size,
          lastAccessed: existingInfo?.lastAccessed || new Date(),
          category: existingInfo?.category || this.determineCookieCategory(decodedName)
        };
        
        newInventory.set(decodedName, cookieInfo);
      });
      
      this.cookieInventory = newInventory;
      
      // Invalidate caches
      this.cachedTotalSize = null;
      this.cachedCategoryCounts = null;
      
      // Log inventory update
      console.debug('Cookie inventory updated:', 
        Array.from(this.cookieInventory.entries())
          .map(([name, info]) => ({ name, size: info.size }))
      );
    } catch (error) {
      console.error('Error updating cookie inventory:', error);
    }
  }

  // Determine cookie category based on name
  private determineCookieCategory(name: string): CookieInfo['category'] {
    if (this.isNecessaryCookie(name)) return 'necessary';
    if (this.isFunctionalCookie(name)) return 'functional';
    if (this.isAnalyticsCookie(name)) return 'analytics';
    if (this.isMarketingCookie(name)) return 'marketing';
    return 'necessary'; // Default to necessary if unknown
  }

  // Check if cookie is necessary
  private isNecessaryCookie(name: string): boolean {
    const necessaryCookies = [
      'zaparound-cookie-consent',
      'session',
      'csrf',
      'auth',
      'sb-',
    ];
    return necessaryCookies.some(prefix => name.startsWith(prefix));
  }

  // Check if cookie is functional
  private isFunctionalCookie(name: string): boolean {
    const functionalCookies = [
      'theme',
      'language',
      'app-language',
      'preferences',
      'ui-',
    ];
    return functionalCookies.some(prefix => name.startsWith(prefix));
  }

  // Check if cookie is analytics
  private isAnalyticsCookie(name: string): boolean {
    const analyticsCookies = [
      '_ga',
      '_gid',
      '_gat',
      'plausible_',
      'amplitude_',
      'mixpanel_',
    ];
    return analyticsCookies.some(prefix => name.startsWith(prefix));
  }

  // Check if cookie is marketing
  private isMarketingCookie(name: string): boolean {
    const marketingCookies = [
      '_fbp',
      '_gcl',
      'ads_',
      'marketing_',
    ];
    return marketingCookies.some(prefix => name.startsWith(prefix));
  }

  // Clean up expired cookies
  public cleanupExpiredCookies(): void {
    try {
      let cleanupCount = 0;
      const now = new Date();
      
      this.cookieInventory.forEach((info, name) => {
        if (info.expires && info.expires < now) {
          deleteCookie(name);
          this.cookieInventory.delete(name);
          cleanupCount++;
        }
      });
      
      if (cleanupCount > 0) {
        console.debug(`Cleaned up ${cleanupCount} expired cookies`);
        this.updateInventory();
      }
    } catch (error) {
      console.error('Error cleaning up expired cookies:', error);
    }
  }

  // Check cookie size limits
  public checkCookieLimits(): void {
    try {
      let totalSize = 0;
      const cookieCount = this.cookieInventory.size;
      
      this.cookieInventory.forEach(info => {
        totalSize += info.size;
        
        // Check individual cookie size
        if (info.size > COOKIE_LIMITS.TOTAL_SIZE) {
          console.warn(`Cookie "${info.name}" exceeds size limit:`, {
            size: info.size,
            limit: COOKIE_LIMITS.TOTAL_SIZE
          });
        }
      });
      
      // Check total number of cookies
      if (cookieCount > COOKIE_LIMITS.TOTAL_NUMBER) {
        console.warn('Total number of cookies exceeds limit:', {
          count: cookieCount,
          limit: COOKIE_LIMITS.TOTAL_NUMBER
        });
      }
      
      // Check total size of all cookies
      if (totalSize > COOKIE_LIMITS.DOMAIN_SIZE) {
        console.warn('Total cookie size exceeds domain limit:', {
          size: totalSize,
          limit: COOKIE_LIMITS.DOMAIN_SIZE
        });
      }
    } catch (error) {
      console.error('Error checking cookie limits:', error);
    }
  }

  // Get cookie inventory
  public getInventory(): Map<string, CookieInfo> {
    return new Map(this.cookieInventory);
  }

  // Get total cookie size with memoization
  public getTotalSize(): number {
    if (this.cachedTotalSize === null) {
      let totalSize = 0;
      this.cookieInventory.forEach(info => {
        totalSize += info.size;
      });
      this.cachedTotalSize = totalSize;
    }
    return this.cachedTotalSize;
  }

  // Get cookie count by category with memoization
  public getCookieCountByCategory(): Record<CookieInfo['category'], number> {
    if (this.cachedCategoryCounts === null) {
      const counts = {
        necessary: 0,
        functional: 0,
        analytics: 0,
        marketing: 0
      };
      
      this.cookieInventory.forEach(info => {
        counts[info.category]++;
      });
      
      this.cachedCategoryCounts = counts;
    }
    return { ...this.cachedCategoryCounts };
  }

  // Update cookie access time
  public updateCookieAccess(name: string): void {
    const cookie = this.cookieInventory.get(name);
    if (cookie) {
      cookie.lastAccessed = new Date();
      this.cookieInventory.set(name, cookie);
    }
  }

  // Clean up resources when the monitor is no longer needed
  public destroy(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    document.removeEventListener('cookie-changed', this.debouncedUpdate);
  }
}

export const cookieMonitor = CookieMonitor.getInstance(); 