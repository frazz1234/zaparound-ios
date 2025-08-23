import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint: number = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < breakpoint;
      setIsMobile(mobile);
      return mobile;
    };
    
    // Check initially
    checkMobile();
    
    // Add event listener for resize
    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        checkMobile();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [breakpoint]);

  return isMobile;
}; 