import { Browser } from '@capacitor/browser';

export interface BrowserOptions {
  url: string;
  presentationStyle?: 'fullscreen' | 'popover';
  toolbarColor?: string;
  navigationBarColor?: string;
  navigationBarDividerColor?: string;
}

export interface BrowserResult {
  type: 'opened' | 'closed' | 'error';
  error?: string;
}

/**
 * Browser service for opening in-app browsers
 * Uses @capacitor/browser for native iOS/Android support
 * Falls back to window.open for web development
 */
class BrowserService {
  /**
   * Open a URL in an in-app browser
   */
  async openBrowser(options: BrowserOptions): Promise<BrowserResult> {
    try {
      // Check if we're running in a Capacitor environment
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        // Native mobile app - use Capacitor Browser
        await Browser.open({
          url: options.url,
          presentationStyle: options.presentationStyle || 'fullscreen',
          toolbarColor: options.toolbarColor || '#1d1d1e', // Using your brand color
          navigationBarColor: options.navigationBarColor || '#1d1d1e',
          navigationBarDividerColor: options.navigationBarDividerColor || '#62626a',
        });
        
        return { type: 'opened' };
      } else {
        // Web environment - fallback to window.open
        const newWindow = window.open(options.url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          return { type: 'opened' };
        } else {
          return { type: 'error', error: 'Failed to open browser window' };
        }
      }
    } catch (error) {
      console.error('Browser service error:', error);
      return { 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Open a URL in the default browser (external)
   */
  async openExternal(url: string): Promise<BrowserResult> {
    try {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        // Native mobile app - use Capacitor Browser with external flag
        await Browser.open({
          url,
          presentationStyle: 'fullscreen',
        });
        return { type: 'opened' };
      } else {
        // Web environment - open in new tab
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          return { type: 'opened' };
        } else {
          return { type: 'error', error: 'Failed to open external link' };
        }
      }
    } catch (error) {
      console.error('External browser error:', error);
      return { 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Close the current in-app browser
   */
  async closeBrowser(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        await Browser.close();
      }
    } catch (error) {
      console.error('Close browser error:', error);
    }
  }

  /**
   * Add listener for browser events
   */
  addListener(eventName: string, listenerFunc: (...args: any[]) => void) {
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      return Browser.addListener(eventName, listenerFunc);
    }
    return { remove: () => {} };
  }

  /**
   * Remove all listeners
   */
  async removeAllListeners(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        await Browser.removeAllListeners();
      }
    } catch (error) {
      console.error('Remove listeners error:', error);
    }
  }
}

// Export singleton instance
export const browserService = new BrowserService();

// Export the class for testing purposes
export { BrowserService };
