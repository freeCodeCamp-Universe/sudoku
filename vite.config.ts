import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { curriculumDataPlugin } from './scripts/curriculumDataPlugin';

export default defineConfig({
  base: '/',
  plugins: [curriculumDataPlugin(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
