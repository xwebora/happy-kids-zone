import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const PWA_MANIFEST_HREF = '/happy-kids-zone/manifest.json';
const PWA_SW_HREF = '/happy-kids-zone/sw.js';

function isAdminRoute() {
  const hash = decodeURIComponent(window.location.hash || '').toLowerCase();
  const route = hash.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '').split('?')[0];
  return route === 'admin';
}

function syncAdminPwa() {
  const existing = document.querySelector<HTMLLinkElement>('link[data-admin-pwa-manifest]');

  if (isAdminRoute()) {
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = PWA_MANIFEST_HREF;
      link.dataset.adminPwaManifest = 'true';
      document.head.appendChild(link);
    }
  } else if (existing) {
    existing.remove();
  }
}

syncAdminPwa();
window.addEventListener('hashchange', syncAdminPwa);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(PWA_SW_HREF, { scope: '/happy-kids-zone/' })
      .catch((error) => console.error('PWA service worker registration failed:', error));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
