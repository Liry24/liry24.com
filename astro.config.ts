// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://liry24.com',
    adapter: vercel({
        webAnalytics: {
            enabled: true,
        },
    }),
    integrations: [icon(), react()],
    vite: {
        plugins: [tailwindcss()],
    },
});
