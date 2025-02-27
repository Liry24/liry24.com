// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

import { links } from './src/utils/microCms';

const redirects: Record<string, string> = {
    '/liria': links.liria,
    '/booth': links.booth,
    '/avatio-site': links.avatio,
    ...Object.fromEntries(
        links.create.map((link) => [`/${link.slug}`, link.url])
    ),
    ...Object.fromEntries(
        links.persona.map((link) => [`/${link.slug}`, link.url])
    ),
};

// https://astro.build/config
export default defineConfig({
    site: 'https://liry24.com',
    output: 'static',
    adapter: vercel({
        webAnalytics: {
            enabled: true,
        },
    }),
    integrations: [icon(), react()],
    vite: {
        plugins: [tailwindcss()],
    },
    redirects: redirects,
});
