import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  css: {
    // preprocessorOptions: {
    //   scss: {
    //     additionalData: `
    //       @use '@css/abstracts' as *;
    //     `,
    //     api: 'modern-compiler',
    //   },
    // },
  },
  server: {
    port: 2000,
  },
});
