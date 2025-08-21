// Revert to synchronous bootstrap (pre-lazy-loading) for stable initialization
import './utils/polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/webkit-native.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@/i18n'; // Import i18next configuration early
import { initSWUpdateListener } from '@/utils/sw-update';

// Version management
const APP_VERSION = import.meta.env.VITE_APP_VERSION || new Date().toISOString().split('T')[0];
const CACHE_KEY = 'zaparound-version';

const versionManager = {
  getCurrentVersion: () => localStorage.getItem(CACHE_KEY),
  setCurrentVersion: (version: string) => localStorage.setItem(CACHE_KEY, version),
  clearCache: async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const appCaches = cacheNames.filter((name) => name.includes('zaparound'));
        await Promise.all(appCaches.map((name) => caches.delete(name)));
      } catch (error) {
        console.error('Error clearing caches:', error);
      }
    }
  },
  shouldUpdate: () => {
    const storedVersion = versionManager.getCurrentVersion();
    return storedVersion && storedVersion !== APP_VERSION;
  },
};

// If a new version is detected, clear caches and notify UI
if (versionManager.shouldUpdate()) {
  versionManager.setCurrentVersion(APP_VERSION);
  versionManager.clearCache().then(() => {
    window.dispatchEvent(new CustomEvent('appUpdateAvailable'));
  });
} else {
  versionManager.setCurrentVersion(APP_VERSION);
}

// Kick-off SW update listener so the UI can prompt users when a new version is ready
initSWUpdateListener();

// React-Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: any) => {
        if (
          error?.message === 'Not authenticated' ||
          error?.message === 'Unauthorized' ||
          error?.status === 404
        ) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Mount the full application immediately (no delayed bootstrap)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
