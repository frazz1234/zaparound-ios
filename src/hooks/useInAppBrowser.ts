import { Browser } from '@capacitor/browser';
import { useCallback } from 'react';

export const useInAppBrowser = () => {
  const openInAppBrowser = useCallback(async (url: string) => {
    try {
      await Browser.open({
        url,
        presentationStyle: 'popover',
        toolbarColor: '#ffffff',
        navigationBarColor: '#000000',
        navigationBarDividerColor: '#cccccc',
        backgroundColor: '#ffffff',
        windowName: '_self'
      });
    } catch (error) {
      console.error('Error opening in-app browser:', error);
      // Fallback to regular window.open if in-app browser fails
      window.open(url, '_blank');
    }
  }, []);

  const openEmail = useCallback(async (email: string) => {
    const mailtoUrl = `mailto:${email}`;
    try {
      await Browser.open({
        url: mailtoUrl,
        presentationStyle: 'popover'
      });
    } catch (error) {
      console.error('Error opening email:', error);
      // Fallback to regular mailto link
      window.location.href = mailtoUrl;
    }
  }, []);

  return {
    openInAppBrowser,
    openEmail
  };
};
