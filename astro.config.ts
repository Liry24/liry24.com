// @ts-check
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import { defineConfig, fontProviders } from 'astro/config'

const redirects = {
    liria: 'https://liria.me',
    booth: 'https://eicosapenta.booth.pm',
    artstation: 'https://www.artstation.com/liry24',
    github: 'https://github.com/Liry24',
    x: 'https://x.com/Liry24g',
    twitter: 'https://twitter.com/Liry24g',
    discord: 'https://discord.com/users/365789612024659969',
    vrchat: 'https://vrchat.com/home/user/usr_933f7024-bf54-408e-88fe-43bf2b81ccf8',
    avatio: 'https://avatio.me/@liry24',
    spotify: 'https://spti.fi/liry24',
    steam: 'https://steamcommunity.com/id/Liry24',
    valorant: 'https://tracker.gg/valorant/profile/riot/Liry%23yoshi/overview',
    pulse: 'https://plsdb.com/profile/liry24',
    geartics: 'https://geartics.com/liry24',
}

// https://astro.build/config
export default defineConfig({
    site: `https://${process.env.PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || 'liry24.com'}`,

    output: 'server',

    adapter: vercel({
        webAnalytics: {
            enabled: true,
        },
        imageService: true,
        isr: {
            expiration: 60 * 60 * 24, // 1 day
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

    image: {
        domains: ['github.com', 'avatars.steamstatic.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: '**.cloudfront.net',
            },
        ],
    },

    redirects: {
        ...Object.fromEntries(
            Object.entries(redirects).map(([key, value]) => [`/${key}`, value])
        ),
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
        liveContentCollections: true,
        staticImportMetaEnv: true,
    },
})
