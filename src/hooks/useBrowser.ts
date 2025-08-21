import { useCallback, useEffect, useRef } from 'react';
import { browserService, BrowserOptions, BrowserResult } from '@/services/browserService';

export interface UseBrowserReturn {
  openBrowser: (options: BrowserOptions) => Promise<BrowserResult>;
  openExternal: (url: string) => Promise<BrowserResult>;
  closeBrowser: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * React hook for using the browser service
 * Provides a clean interface for opening in-app browsers
 */
export function useBrowser(): UseBrowserReturn {
  const isLoadingRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  // Browser event listeners
  useEffect(() => {
    const listeners = {
      browserFinished: browserService.addListener('browserFinished', () => {
        console.log('Browser finished');
      }),
      browserPageLoaded: browserService.addListener('browserPageLoaded', () => {
        console.log('Browser page loaded');
      }),
    };

    // Cleanup listeners on unmount
    return () => {
      Object.values(listeners).forEach(listener => listener.remove());
      browserService.removeAllListeners();
    };
  }, []);

  const openBrowser = useCallback(async (options: BrowserOptions): Promise<BrowserResult> => {
    try {
      isLoadingRef.current = true;
      errorRef.current = null;
      
      const result = await browserService.openBrowser(options);
      
      if (result.type === 'error') {
        errorRef.current = result.error || 'Failed to open browser';
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errorRef.current = errorMessage;
      return { type: 'error', error: errorMessage };
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const openExternal = useCallback(async (url: string): Promise<BrowserResult> => {
    try {
      isLoadingRef.current = true;
      errorRef.current = null;
      
      const result = await browserService.openExternal(url);
      
      if (result.type === 'error') {
        errorRef.current = result.error || 'Failed to open external link';
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errorRef.current = errorMessage;
      return { type: 'error', error: errorMessage };
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const closeBrowser = useCallback(async (): Promise<void> => {
    try {
      await browserService.closeBrowser();
    } catch (error) {
      console.error('Failed to close browser:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    errorRef.current = null;
  }, []);

  return {
    openBrowser,
    openExternal,
    closeBrowser,
    isLoading: isLoadingRef.current,
    error: errorRef.current,
    clearError,
  };
}
