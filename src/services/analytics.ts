// Google Analytics service

/**
 * Analytics service for Google Analytics 4
 */
class AnalyticsService {
  private measurementId = 'G-NK9ZZDPQ7K';
  private isInitialized = false;

  constructor() {
    // Check if analytics exists
    this.isInitialized = typeof window !== 'undefined' && !!window.gtag;
  }

  /**
   * Initialize analytics (always enabled now)
   */
  init(consentState?: { analytics: boolean; marketing: boolean }) {
    if (!this.isInitialized) return;
    
    // Always enable GA4 and marketing
    window.gtag('consent', 'update', {
      analytics_storage: 'granted', // Always enable GA4
      ad_storage: 'granted',        // Always enable marketing
    });
  }

  /**
   * Update consent settings (always grants all permissions)
   */
  updateConsent(consentState: { analytics: boolean; marketing: boolean }) {
    if (!this.isInitialized) return;

    // Always keep GA4 and marketing enabled
    window.gtag('consent', 'update', {
      analytics_storage: 'granted', // Always enable GA4
      ad_storage: 'granted',        // Always enable marketing
    });
  }

  /**
   * Track page view
   */
  pageView(path: string, title?: string) {
    if (!this.isInitialized) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }

  /**
   * Track event
   */
  event(name: string, params: Record<string, any> = {}) {
    if (!this.isInitialized) return;

    window.gtag('event', name, params);
  }

  /**
   * Track user property
   */
  setUserProperty(name: string, value: string) {
    if (!this.isInitialized) return;

    window.gtag('set', 'user_properties', { [name]: value });
  }

  /**
   * Set user ID for cross-device tracking (always enabled now)
   */
  setUserId(id: string | null) {
    if (!this.isInitialized) return;

    if (id) {
      window.gtag('config', this.measurementId, {
        user_id: id
      });
    }
  }
}

// Export as singleton
export const analytics = new AnalyticsService();

// For convenience in JSX contexts
export function trackEvent(name: string, params: Record<string, any> = {}) {
  analytics.event(name, params);
}

// For convenience in JSX contexts
export function trackPageView(path: string, title?: string) {
  analytics.pageView(path, title);
} 