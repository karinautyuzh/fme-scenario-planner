import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fme-scenario-planner/' : '/',
  plugins: [react()],
  server: {
    port: 3001,
  },
}));
