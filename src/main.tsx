import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isAdminApp = window.location.pathname.startsWith('/happy-kids-zone/admin/');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      if (isAdminApp) {
        await navigator.serviceWorker.register('/happy-kids-zone/admin/sw.js', {
          scope: '/happy-kids-zone/admin/',
          updateViaCache: 'none',
        });
      } else {
        // Remove only the legacy root-scoped worker; never unregister the admin PWA.
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => {
          const scriptUrl = registration.active?.scriptURL
            || registration.waiting?.scriptURL
            || registration.installing?.scriptURL
            || '';
          if (scriptUrl.endsWith('/happy-kids-zone/sw.js')) {
            return registration.unregister();
          }
          return Promise.resolve(false);
        }));

        // Clear only the legacy cache. Leave admin PWA caches intact.
        await caches.delete('happy-kids-admin-v2');
      }
    } catch (error) {
      console.warn('PWA setup skipped:', error);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
