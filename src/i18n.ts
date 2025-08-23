import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es'];
const DEFAULT_LANGUAGE = 'en';

// Custom language detector for URL-based language detection
const urlLanguageDetector = {
  name: 'url',
  lookup: () => {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    return SUPPORTED_LANGUAGES.includes(firstSegment) ? firstSegment : undefined;
  },
  cacheUserLanguage: () => {},
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: [
      'navigation',
      'trip',
      'home',
      'pricing',
      'about',
      'auth',
      'common',
      'footer',
      'profile',
      'languageSelector',
      'notFound',
      'contact',
      'blog',
      'admin',
      'community',
      'legal',
      'cookies',
      'dashboard',
      'faq',
      'currency',
      'survey',
      'zapbooking',
      'travelFlight',
      'unsubscribe'
    ],
    defaultNS: 'common',
    detection: {
      order: ['url', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupFromPathIndex: 0,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 