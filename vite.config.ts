import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// VITE_BASE: carpeta donde se publica la tienda. En GitHub Pages es /provision-frontend/.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: { port: 5173 },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['src/pruebas/preparar.ts'],
    },
  };
});
