import { Button, ButtonProps } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

interface CookieSettingsButtonProps extends Omit<ButtonProps, 'onClick'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CookieSettingsButton({
  variant = 'outline',
  size = 'default',
  children,
  ...props
}: CookieSettingsButtonProps) {
  const { t } = useTranslation('cookies');

  const handleClick = () => {
    // Show a simple alert that all cookies are automatically accepted
    alert(t('allCookiesAccepted', 'All cookies are automatically accepted. No settings to configure.'));
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      {...props}
    >
      <Settings className="h-4 w-4 mr-2" />
      {children || t('cookieSettings', 'Cookie Settings')}
    </Button>
  );
} 