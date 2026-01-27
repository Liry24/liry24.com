import { parseURL } from 'ufo'

const title = 'Liry24'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    extends: ['../../packages/nuxt/src/layer'],

    modules: ['motion-v/nuxt'],

    css: ['~/assets/css/main.css'],

    runtimeConfig: {
        public: {
            domain: process.env.DOMAIN,
            imagesDomain: process.env.TIGRIS_STORAGE_DOMAIN,
        },
        tigrisStorage: {
            accessKeyId: process.env.TIGRIS_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
            bucket: process.env.TIGRIS_STORAGE_BUCKET,
            domain: process.env.TIGRIS_STORAGE_DOMAIN,
        },
    },

    nitro: {
        storage: {
            cache: {
                driver: 'vercel-runtime-cache',
                base: 'liry24',
            },
        },
        devStorage: {
            cache: {
                driver: 'null',
            },
        },
    },

    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        head: {
            title,
            htmlAttrs: { lang: 'ja', prefix: 'og: https://ogp.me/ns#' },
        },
    },

    fonts: {
        families: [
            { name: 'Geist', provider: 'google' },
            { name: 'Geist Mono', provider: 'google' },
            { name: 'Special Gothic Expanded One', provider: 'google' },
        ],
        defaults: {
            weights: [100, 200, 300, 300, 400, 500, 600, 700, 800, 900],
        },
    },

    icon: {
        clientBundle: {
            icons: ['mingcute:sun-fill', 'mingcute:moon-fill'],
        },
    },

    image: {
        domains: [
            parseURL(process.env.TIGRIS_STORAGE_DOMAIN).host!,
            'avatars.githubusercontent.com',
        ],
    },
})
