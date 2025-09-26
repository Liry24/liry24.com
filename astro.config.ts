// @ts-check
import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import vercel from '@astrojs/vercel'
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
    site: `https://${process.env.PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || 'liry24.com'}`,

    output: 'server',

    adapter: vercel({
        webAnalytics: {
            enabled: true,
        },
    }),

    integrations: [
        icon({
            iconDir: 'src/assets/icons',
        }),
        react(),
    ],

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
