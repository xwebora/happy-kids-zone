import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { testMenuItem } from './services/menuService';

testMenuItem()
  .then((id) => {
    console.log('🎉 Firestore menu test successful:', id);
  })
  .catch((error) => {
    console.error('❌ Firestore menu test failed:', error);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
