import { useEffect } from 'react';

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

    // Web Vitals monitoring is disabled - web-vitals package not available
    if (debug) {
      console.log('Web Vitals monitoring disabled - web-vitals package not available');
    }
  }, [enabled, debug, analyticsId]);

  return null;
}

// Hook for manual Web Vitals reporting
export const useWebVitals = (callback?: (metric: any) => void) => {
  useEffect(() => {
    if (!callback) return;
    
    // Web Vitals monitoring is disabled - web-vitals package not available
    console.log('Web Vitals monitoring disabled - web-vitals package not available');
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
