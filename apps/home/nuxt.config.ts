import { parseURL, withoutProtocol } from 'ufo'

const baseURL = import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://liry24.com'
const imagesDomain = 'https://images.liry24.com'
const title = 'Liry24'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-07-30',

    future: { compatibilityVersion: 5 },

    devtools: { enabled: true, timeline: { enabled: true } },

    modules: [
        '@comark/nuxt',
        '@nuxt/ui',
        '@nuxt/image',
        '@nuxtjs/sitemap',
        'nuxt-og-image',
        '@vueuse/nuxt',
        'motion-v/nuxt',
        '@nuxt/hints',
        '@nuxt/a11y',
    ],

    css: ['~/assets/css/main.css'],

    experimental: {
        crossOriginPrefetch: true,
        extractAsyncDataHandlers: true,
        inlineRouteRules: true,
        sharedPrerenderData: true,
        typescriptPlugin: true,
        nitroAutoImports: true,
        prefetchPreloadTags: true,
    },

    runtimeConfig: {
        public: {
            siteURL: baseURL,
            imagesDomain,
        },
    },

    routeRules: {
        '/': { prerender: true },
        '/arts': { prerender: true },
        '/works': { prerender: true },
        '/posts': { prerender: true },
        '/sitemap.xml': { prerender: true },
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
            nodeCompat: true,
            dev: {
                configPath: './.data/wrangler.dev.jsonc',
                persistDir: './.data/wrangler/state/v3',
            },
            wrangler: {
                name: 'liry24-com',
                routes: [
                    {
                        pattern: withoutProtocol(baseURL),
                        custom_domain: true,
                    },
                ],
                vars: {
                    NUXT_PUBLIC_SITE_URL: baseURL,
                    R2_DOMAIN: imagesDomain,
                },
                d1_databases: [
                    {
                        binding: 'DB',
                        database_name: process.env.D1_NAME!,
                        database_id: process.env.D1_ID!,
                    },
                ],
                observability: {
                    logs: {
                        enabled: true,
                        invocation_logs: true,
                    },
                },
            },
        },
        compressPublicAssets: true,
        prerender: {
            crawlLinks: false,
            failOnError: true,
        },
        experimental: {
            asyncContext: true,
        },
    },

    typescript: {
        tsConfig: {
            include: ['../scripts/*'],
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
            title,
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
            {
                name: 'Special Gothic Expanded One',
                weights: [400],
                provider: 'google',
                preload: true,
                global: true,
            },
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

    sitemap: {
        zeroRuntime: true,
        sources: ['/api/__sitemap__/urls'],
    },

    site: {
        url: baseURL,
    },

    ui: {
        experimental: {
            componentDetection: true,
        },
    },

    $production: {
        image: {
            provider: 'cloudflare',
            cloudflare: {
                baseURL,
            },
            domains: [parseURL(process.env.R2_DOMAIN).host!, 'avatars.githubusercontent.com'],
        },
    },
})
