import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
    compatibilityDate: '2026-07-30',

    future: { compatibilityVersion: 5 },

    devtools: { enabled: true, timeline: { enabled: true } },

    modules: ['@comark/nuxt', '@nuxt/ui', '@nuxt/image', '@vueuse/nuxt', '@nuxt/hints', '@nuxt/a11y'],

    css: [fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))],

    experimental: {
        crossOriginPrefetch: true,
        extractAsyncDataHandlers: true,
        typescriptPlugin: true,
        nitroAutoImports: true,
        prefetchPreloadTags: true,
    },

    vite: {
        vue: {
            features: {
                optionsAPI: false,
            },
        },
    },

    nitro: {
        preset: 'cloudflare_module',
        cloudflare: {
            deployConfig: true,
        },
        compressPublicAssets: true,
        experimental: {
            asyncContext: true,
        },
    },

    typescript: {
        tsConfig: {
            compilerOptions: {
                noUncheckedIndexedAccess: true,
                types: ['@cloudflare/workers-types', 'bun'],
            },
        },
    },

    imports: {
        presets: [{ from: 'cnfast', imports: ['cn'] }],
    },

    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        head: {
            htmlAttrs: { lang: 'ja', prefix: 'og: https://ogp.me/ns#' },
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            ],
        },
    },

    fonts: {
        families: [
            { name: 'Geist', provider: 'google', preload: true },
            { name: 'Geist Mono', provider: 'google', preload: true },
        ],
        defaults: {
            weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        },
    },

    icon: {
        clientBundle: {
            icons: ['mingcute:sun-fill', 'mingcute:moon-fill'],
            scan: true,
            includeCustomCollections: true,
        },
        serverBundle: {
            collections: [
                {
                    prefix: 'liria',
                    fetchEndpoint: 'https://icons.liria.me/liria.json',
                },
            ],
        },
    },

    ui: {
        experimental: {
            componentDetection: true,
        },
    },
})
