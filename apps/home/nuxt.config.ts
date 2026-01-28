import { parseURL } from 'ufo'

const title = 'Liry24'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    extends: ['@repo/nuxt'],

    modules: ['motion-v/nuxt'],

    css: ['~/assets/css/main.css'],

    runtimeConfig: {
        public: {
            homeDomain: process.env.HOME_DOMAIN,
            imagesDomain: process.env.TIGRIS_STORAGE_DOMAIN,
        },
        bypassToken: process.env.BYPASS_TOKEN,
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

    routeRules: {
        '/': { isr: 60 * 60 * 24 * 30 },
        '/arts': { isr: 60 * 60 * 24 * 30 },
        '/arts/**': { isr: 60 * 60 * 24 * 30 },
        '/works': { isr: 60 * 60 * 24 * 30 },
        '/works/**': { isr: 60 * 60 * 24 * 30 },
        '/posts': { isr: 60 * 60 * 24 * 30 },
        '/posts/**': { isr: 60 * 60 * 24 * 30 },
        '/avatar.*': { isr: 60 * 60 * 24 * 30 },
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
