import { useEffect } from 'react';
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

interface WebVitalsReporterProps {
  enabled?: boolean;
  debug?: boolean;
  analyticsId?: string;
}

export function WebVitalsReporter({ 
  enabled = true, 
  debug = false,
  analyticsId = 'G-NK9ZZDPQ7K'
}: WebVitalsReporterProps) {
  
  useEffect(() => {
    if (!enabled) return;

    // Function to send metrics to analytics
    const sendToAnalytics = (metric: any) => {
      // Send to Google Analytics
      if (window.gtag && analyticsId) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }

      // Console log for debugging
      if (debug) {
        console.log('Web Vitals:', metric);
      }

      // Send to custom analytics if needed
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'web_vitals',
          metric_name: metric.name,
          metric_value: metric.value,
          metric_id: metric.id,
          metric_rating: metric.rating,
        });
      }
    };

    // Monitor Core Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    
    // Monitor additional metrics
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    
    // Monitor INP (Interaction to Next Paint) - new metric replacing FID
    onINP(sendToAnalytics);

  }, [enabled, debug, analyticsId]);

  return null;
}

// Hook for manual Web Vitals reporting
export const useWebVitals = (callback?: (metric: any) => void) => {
  useEffect(() => {
    if (!callback) return;

    onCLS(callback);
    onFID(callback);
    onLCP(callback);
    onFCP(callback);
    onTTFB(callback);
    onINP(callback);
  }, [callback]);
};

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, action: string, config: any) => void;
    dataLayer?: any[];
  }
}

export default WebVitalsReporter;
