import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/fme-scenario-planner/',
  plugins: [react()],
  server: {
    port: 3001,
  },
});
