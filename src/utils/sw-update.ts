// src/utils/sw-update.ts
// Utility to bridge vite-plugin-pwa update events ➜ our existing "appUpdateAvailable" custom event.
// Keeps the historical contract used by UpdateNotification and other components.
// This file intentionally contains **no** React code so it can be imported from anywhere.

/**
 * Starts listening to service-worker lifecycle so we can dispatch
 * the historical `appUpdateAvailable` event when a fresh SW is ready.
 *
 * Must be called **once** on application bootstrap (e.g. from main.tsx).
 */
export function initSWUpdateListener() {
  // Service workers are only available in secure contexts (https) & supported browsers
  if (!('serviceWorker' in navigator)) return;

  const notify = () => {
    window.dispatchEvent(new CustomEvent('appUpdateAvailable'));
  };

  // Wait until the first SW is ready – this also guarantees we have a registration
  navigator.serviceWorker.ready
    .then((registration) => {
      // 1. If a new SW is already waiting when the page loads (e.g. user opened a stale tab)
      if (registration.waiting) {
        notify();
      }

      // 2. Listen for future updates discovered by workbox (autoUpdate strategy)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // Once the new SW is installed *and* there is already a controlling SW –
          // meaning this is an update, not the very first install.
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notify();
          }
        });
      });
    })
    .catch((err) => {
      // Shouldn’t happen often, but log for diagnostic purposes only – no user impact
      console.error('Failed to obtain service-worker registration:', err);
    });
} 