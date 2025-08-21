import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';

interface LanguageRouterProps {
  children: React.ReactNode;
}

// Paths that should not be redirected with language prefix
const EXCLUDED_PATHS = [
  '/robots.txt',
  '/manifest.json',
  '/favicon.ico',
  '/api/',
];

// File extensions that should not be redirected
const EXCLUDED_EXTENSIONS = [
  '.xml',
  '.txt',
  '.json',
  '.ico',
  '.png',
  '.webp',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.css',
  '.js',
];

export function LanguageRouter({ children }: LanguageRouterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Check if the current path should be excluded from language redirection
    const shouldExcludePath = EXCLUDED_PATHS.some(path => 
      location.pathname === path || location.pathname.startsWith(path)
    );

    // Check if the path ends with any excluded extension
    const hasExcludedExtension = EXCLUDED_EXTENSIONS.some(ext => 
      location.pathname.toLowerCase().endsWith(ext)
    );

    if (shouldExcludePath || hasExcludedExtension) {
      return;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];

    // If the first segment is a valid language code
    if (SUPPORTED_LANGUAGES.includes(firstSegment)) {
      // Update i18n language if it's different
      if (i18n.language !== firstSegment) {
        i18n.changeLanguage(firstSegment);
      }
    } else {
      // If no language in URL, redirect to default language
      // Preserve the hash parameters
      const newPath = `/${i18n.language}${location.pathname}${location.hash}`;
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, location.hash, i18n, navigate]);

  return <>{children}</>;
} 