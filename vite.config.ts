import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { curriculumDataPlugin } from './scripts/curriculumDataPlugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, ['SHOW_']);
  const showLearn = mode !== 'production' && env.SHOW_LEARN === 'true';

  return {
    base: '/',
    plugins: [showLearn && curriculumDataPlugin(), react()].filter(Boolean),
    define: {
      'import.meta.env.SHOW_LEARN': JSON.stringify(showLearn ? 'true' : 'false'),
    },
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
  };
});
