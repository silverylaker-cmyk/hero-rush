import { defineConfig } from 'vite';
export default defineConfig({ base: '/hero-rush/', build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } }, chunkSizeWarningLimit: 1600 }, server: { port: 5173, strictPort: true } });
