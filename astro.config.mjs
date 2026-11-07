import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import path from 'path';

export default defineConfig({
  redirects: {
    '/quote': '/get-quote',
    '/industries/hospitality': '/industries/hotels-hospitality',
    '/industries/wedding': '/industries/wedding-personal',
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    envPrefix: ['VITE_', 'PUBLIC_'],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
        'react-router-dom': path.resolve('./src/lib/router.jsx'),
      },
    },
  },
});

