import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  FCP: number | null;
  LCP: number | null;
  FID: number | null;
  CLS: number | null;
  TTFB: number | null;
  TTI: number | null;
}

interface PerformanceObserver {
  observe: (options: any) => void;
  disconnect: () => void;
}

declare global {
  interface Window {
    PerformanceObserver: {
      new (callback: (list: any) => void): PerformanceObserver;
      supportedEntryTypes?: string[];
    };
    performance: {
      getEntriesByType: (type: string) => any[];
      mark: (name: string) => void;
      measure: (name: string, startMark?: string, endMark?: string) => void;
    };
  }
}

export function usePerformance(onMetricsUpdate?: (metrics: PerformanceMetrics) => void) {
  const metrics: PerformanceMetrics = {
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    TTI: null,
  };

  const sendToAnalytics = useCallback((metric: string, value: number) => {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric,
        value: Math.round(value),
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          value,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch(console.error);
    }
  }, []);

  const measureFCP = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry: any) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          const fcp = fcpEntry.startTime;
          metrics.FCP = fcp;
          sendToAnalytics('FCP', fcp);
          onMetricsUpdate?.(metrics);
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }
  }, [sendToAnalytics, onMetricsUpdate]);

  const measureLCP = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcpEntry = entries[entries.length - 1] as any;
        if (lcpEntry) {
          const lcp = lcpEntry.startTime;
          metrics.LCP = lcp;
          sendToAnalytics('LCP', lcp);
          onMetricsUpdate?.(metrics);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }, [sendToAnalytics, onMetricsUpdate]);

  const measureFID = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          metrics.FID = fid;
          sendToAnalytics('FID', fid);
          onMetricsUpdate?.(metrics);
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }, [sendToAnalytics, onMetricsUpdate]);

  const measureCLS = useCallback(() => {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            metrics.CLS = clsValue;
            sendToAnalytics('CLS', clsValue);
            onMetricsUpdate?.(metrics);
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }, [sendToAnalytics, onMetricsUpdate]);

  const measureTTFB = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const ttfb = entry.responseStart - entry.requestStart;
          metrics.TTFB = ttfb;
          sendToAnalytics('TTFB', ttfb);
          onMetricsUpdate?.(metrics);
        });
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
  }, [sendToAnalytics, onMetricsUpdate]);

  const measureTTI = useCallback(() => {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const tti = entry.startTime;
          metrics.TTI = tti;
          sendToAnalytics('TTI', tti);
          onMetricsUpdate?.(metrics);
        });
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }, [sendToAnalytics, onMetricsUpdate]);

  const measureCustomMetrics = useCallback(() => {
    // Measure custom metrics
    if (typeof window !== 'undefined' && window.performance) {
      // Measure time to interactive
      const navigationEntry = window.performance.getEntriesByType('navigation')[0] as any;
      if (navigationEntry) {
        const domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart;
        const loadComplete = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
        
        sendToAnalytics('DOMContentLoaded', domContentLoaded);
        sendToAnalytics('LoadComplete', loadComplete);
      }

      // Measure resource loading times
      const resourceEntries = window.performance.getEntriesByType('resource');
      resourceEntries.forEach((entry: any) => {
        const duration = entry.duration;
        const transferSize = entry.transferSize;
        
        if (duration > 1000) { // Log slow resources
          console.warn(`Slow resource: ${entry.name} took ${duration}ms`);
        }
        
        sendToAnalytics('ResourceLoad', duration);
      });
    }
  }, [sendToAnalytics]);

  const markPageLoad = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark('page-loaded');
      
      // Measure time from navigation start to page load
      window.performance.measure('page-load-time', 'navigationStart', 'page-loaded');
      
      const measure = window.performance.getEntriesByName('page-load-time')[0] as any;
      if (measure) {
        sendToAnalytics('PageLoadTime', measure.duration);
      }
    }
  }, [sendToAnalytics]);

  useEffect(() => {
    // Start measuring when component mounts
    measureFCP();
    measureLCP();
    measureFID();
    measureCLS();
    measureTTFB();
    measureTTI();
    measureCustomMetrics();

    // Mark page load when component is ready
    const timer = setTimeout(markPageLoad, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [measureFCP, measureLCP, measureFID, measureCLS, measureTTFB, measureTTI, measureCustomMetrics, markPageLoad]);

  return {
    metrics,
    markPageLoad,
    measureCustomMetrics,
  };
} 