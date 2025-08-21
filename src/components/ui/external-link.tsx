import React from 'react';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useBrowser } from '@/hooks/useBrowser';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  presentationStyle?: 'fullscreen' | 'popover';
  showIcon?: boolean;
  disabled?: boolean;
}

/**
 * ExternalLink component that opens URLs in an in-app browser
 * Uses @capacitor/browser for native mobile support
 */
export function ExternalLink({
  href,
  children,
  className,
  variant = 'link',
  size = 'default',
  presentationStyle = 'fullscreen',
  showIcon = true,
  disabled = false,
}: ExternalLinkProps) {
  const { openBrowser, isLoading, error } = useBrowser();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled || isLoading) return;

    try {
      await openBrowser({
        url: href,
        presentationStyle,
        toolbarColor: '#1d1d1e', // Your brand color
        navigationBarColor: '#1d1d1e',
        navigationBarDividerColor: '#62626a',
      });
    } catch (error) {
      console.error('Failed to open external link:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('inline-flex items-center gap-2', className)}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={`Open ${href} in browser`}
    >
      {children}
      {showIcon && <ExternalLinkIcon className="h-4 w-4" />}
      {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
    </Button>
  );
}

/**
 * Simple text link version that opens in browser
 */
export function ExternalTextLink({
  href,
  children,
  className,
  presentationStyle = 'fullscreen',
  disabled = false,
}: Omit<ExternalLinkProps, 'variant' | 'size' | 'showIcon'>) {
  const { openBrowser, isLoading } = useBrowser();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled || isLoading) return;

    try {
      await openBrowser({
        url: href,
        presentationStyle,
        toolbarColor: '#1d1d1e',
        navigationBarColor: '#1d1d1e',
        navigationBarDividerColor: '#62626a',
      });
    } catch (error) {
      console.error('Failed to open external link:', error);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      aria-label={`Open ${href} in browser`}
    >
      {children}
      <ExternalLinkIcon className="h-3 w-3" />
      {isLoading && <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />}
    </a>
  );
}
