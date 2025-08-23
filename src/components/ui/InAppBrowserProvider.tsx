import React, { useEffect, useRef } from 'react';
import { useInAppBrowser } from '@/hooks/useInAppBrowser';

interface InAppBrowserProviderProps {
  children: React.ReactNode;
}

export const InAppBrowserProvider: React.FC<InAppBrowserProviderProps> = ({ children }) => {
  const { openInAppBrowser } = useInAppBrowser();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Check if it's an external link
      const isExternal = href.startsWith('http://') || 
                        href.startsWith('https://') || 
                        href.startsWith('mailto:') ||
                        href.startsWith('tel:');

      // Don't intercept internal links or links with specific targets
      if (!isExternal || link.target === '_self' || link.hasAttribute('data-no-inapp')) {
        return;
      }

      // Prevent default behavior
      event.preventDefault();
      
      // Open in in-app browser
      openInAppBrowser(href);
    };

    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [openInAppBrowser]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};
