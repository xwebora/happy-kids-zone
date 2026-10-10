import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default {
  base: '/happy-kids-zone/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        admin: resolve(projectRoot, 'admin/index.html'),
      },
    },
  },
};
