// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import vercel from '@astrojs/vercel'
import react from '@astrojs/react'

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
    experimental: {
        fonts: [
            {
                provider: fontProviders.google(),
                name: 'Geist',
                cssVariable: '--font-geist',
                weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
            },
        ],
    },
})
