import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Replace 'catalogue-price-checker' with your actual repository name
  base: '/catalogue-price-checker/',
});
