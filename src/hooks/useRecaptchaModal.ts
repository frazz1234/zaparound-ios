import { useEffect } from 'react';

export const useRecaptchaModal = () => {
  useEffect(() => {
    // Function to fix reCAPTCHA z-index
    const fixRecaptchaZIndex = () => {
      // Select all reCAPTCHA related elements
      const recaptchaElements = [
        // reCAPTCHA iframe
        ...document.querySelectorAll('iframe[src*="recaptcha"]'),
        // reCAPTCHA container divs
        ...document.querySelectorAll('div[style*="z-index: 2000000000"]'),
        // reCAPTCHA challenge popup
        ...document.querySelectorAll('div[style*="position: fixed"][style*="z-index"]'),
        // Any div containing reCAPTCHA iframe
        ...document.querySelectorAll('div:has(> iframe[src*="recaptcha"])')
      ];

      recaptchaElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          // Force high z-index
          el.style.setProperty('z-index', '99999', 'important');
          
          // Ensure it's not affected by parent containment
          if (el.tagName === 'IFRAME') {
            const parent = el.parentElement;
            if (parent instanceof HTMLElement) {
              parent.style.setProperty('z-index', '99999', 'important');
              parent.style.setProperty('position', 'relative', 'important');
            }
          }
        }
      });
    };

    // Initial fix
    fixRecaptchaZIndex();

    // Create observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const html = node.outerHTML || '';
            if (html.includes('recaptcha') || html.includes('z-index: 2000000000')) {
              shouldFix = true;
            }
          }
        });
      });

      if (shouldFix) {
        setTimeout(fixRecaptchaZIndex, 100);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    // Also listen for clicks on the page to ensure reCAPTCHA stays on top
    const handleClick = () => {
      setTimeout(fixRecaptchaZIndex, 50);
    };

    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick);
    };
  }, []);
};