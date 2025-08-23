import { Button, ButtonProps } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useCookieConsentContext } from '@/providers/CookieConsentProvider';
import { Cookie } from 'lucide-react';
import React, { useEffect } from 'react';

interface CookieSettingsButtonProps extends Omit<ButtonProps, 'onClick'> {
  showIcon?: boolean;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function CookieSettingsButton({ 
  showIcon = true, 
  variant = "link", 
  size = "sm",
  className,
  ...props 
}: CookieSettingsButtonProps) {
  const { t } = useTranslation('cookies');
  const cookieContext = useCookieConsentContext();

  // Debug: Log component mount and context state
  useEffect(() => {
    console.log('CookieSettingsButton mounted');
    console.log('Cookie context state:', {
      isOpen: cookieContext?.isOpen,
      hasInteracted: cookieContext?.consentState.hasInteracted,
      consentState: cookieContext?.consentState
    });
  }, []);

  // Debug: Log context changes
  useEffect(() => {
    console.log('Cookie context updated:', {
      isOpen: cookieContext?.isOpen,
      hasInteracted: cookieContext?.consentState.hasInteracted,
      consentState: cookieContext?.consentState
    });
  }, [cookieContext?.isOpen, cookieContext?.consentState]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Cookie settings button clicked');
    
    try {
      if (!cookieContext?.openSettings) {
        console.error('openSettings function is not available in context');
        throw new Error('openSettings function is not available');
      }
      
      console.log('Calling openSettings...');
      cookieContext.openSettings();
      console.log('openSettings called successfully');
    } catch (error) {
      console.error('Error opening cookie settings:', error);
    }
  };

  if (!cookieContext) {
    console.error('CookieSettingsButton must be used within a CookieConsentProvider');
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {showIcon && <Cookie className="h-4 w-4 mr-2" />}
      {t('settings')}
    </Button>
  );
} 