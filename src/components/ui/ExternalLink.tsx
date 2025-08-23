import React from 'react';
import { useInAppBrowser } from '@/hooks/useInAppBrowser';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  children,
  className = '',
  onClick
}) => {
  const { openInAppBrowser } = useInAppBrowser();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Open in in-app browser
    openInAppBrowser(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
