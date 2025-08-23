/**
 * Development mode utilities for testing and development purposes
 */

// Check if we're in development mode
export const isDevelopmentMode = (): boolean => {
  // Check for Vite's development mode
  if (import.meta.env.DEV) {
    return true;
  }
  
  // Check for localhost or development URLs
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.includes('ngrok') ||
           hostname.includes('vercel.app') && hostname.includes('dev');
  }
  
  // Check for NODE_ENV in server environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
};

// Apply development discount to amount (returns 0 in dev mode)
export const applyDevDiscount = (amount: number, currency: string = 'USD'): number => {
  if (isDevelopmentMode()) {
    console.log(`🔧 DEV MODE: Applying 100% discount to ${amount} ${currency}`);
    return 0;
  }
  return amount;
};

// Apply development discount to amount in cents (returns 0 in dev mode)
export const applyDevDiscountCents = (amountInCents: number, currency: string = 'USD'): number => {
  if (isDevelopmentMode()) {
    console.log(`🔧 DEV MODE: Applying 100% discount to ${amountInCents} cents (${currency})`);
    return 0;
  }
  return amountInCents;
};

// Get development mode info for debugging
export const getDevModeInfo = () => {
  return {
    isDev: isDevelopmentMode(),
    env: import.meta.env.MODE,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'unknown'
  };
}; 