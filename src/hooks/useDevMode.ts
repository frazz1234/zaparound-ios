import { useMemo } from 'react';
import { isDevelopmentMode, applyDevDiscount, applyDevDiscountCents, getDevModeInfo } from '@/utils/devMode';

/**
 * React hook for development mode utilities
 */
export function useDevMode() {
  const devInfo = useMemo(() => getDevModeInfo(), []);
  
  const isDev = useMemo(() => isDevelopmentMode(), []);
  
  const applyDiscount = useMemo(() => applyDevDiscount, []);
  const applyDiscountCents = useMemo(() => applyDevDiscountCents, []);
  
  return {
    isDev,
    devInfo,
    applyDiscount,
    applyDiscountCents,
    // Helper for displaying dev mode info in UI
    getDevModeBadge: () => isDev ? '🔧 DEV MODE' : null,
    // Helper for conditional rendering
    renderIfDev: (component: React.ReactNode) => isDev ? component : null,
    renderIfProd: (component: React.ReactNode) => !isDev ? component : null,
  };
} 