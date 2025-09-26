// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import vercel from '@astrojs/vercel'
import react from '@astrojs/react'
import vue from '@astrojs/vue'

// https://astro.build/config
export default defineConfig({
    site: process.env.PUBLIC_VERCEL_URL || 'https://liry24.com',

    output: 'server',

    adapter: vercel({
        webAnalytics: {
            enabled: true,
        },
    }),

    integrations: [icon(), react(), vue()],

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
        staticImportMetaEnv: true,
    },
})
