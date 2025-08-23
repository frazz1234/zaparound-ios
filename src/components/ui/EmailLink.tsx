import React from 'react';
import { useInAppBrowser } from '@/hooks/useInAppBrowser';

interface EmailLinkProps {
  email: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const EmailLink: React.FC<EmailLinkProps> = ({
  email,
  children,
  className = '',
  onClick
}) => {
  const { openEmail } = useInAppBrowser();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Open email in in-app browser
    openEmail(email);
  };

  return (
    <a
      href={`mailto:${email}`}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
};
