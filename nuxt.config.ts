import { parseURL, withoutProtocol } from 'ufo'

const baseURL = import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://liry24.com'
const title = 'Liry24'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: 'latest',

    future: {
        compatibilityVersion: 5,
    },

    devtools: {
        enabled: true,
        timeline: {
            enabled: true,
        },
    },

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

    runtimeConfig: {
        public: {
            imagesDomain: process.env.R2_DOMAIN,
        },
        aiGateway: {
            apiKey: process.env.AI_GATEWAY_API_KEY,
        },
        allowSignup: process.env.ALLOW_SIGNUP,
        betterAuth: {
            secret: process.env.BETTER_AUTH_SECRET,
        },
        bypassToken: process.env.BYPASS_TOKEN,
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        r2: {
            accountId: process.env.R2_ACCOUNT_ID,
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            bucket: process.env.R2_BUCKET,
            domain: process.env.R2_DOMAIN,
        },
        vercel: {
            clientId: process.env.VERCEL_CLIENT_ID,
            clientSecret: process.env.VERCEL_CLIENT_SECRET,
        },
    },

    routeRules: {
        '/admin/**': { appMiddleware: 'admin', appLayout: 'admin' },
    },

    vite: {
        vue: {
            features: {
                optionsAPI: false,
            },
        },
        optimizeDeps: {
            include: [
                '@nuxt/ui > prosemirror-state',
                '@nuxt/ui > prosemirror-transform',
                '@nuxt/ui > prosemirror-model',
                '@nuxt/ui > prosemirror-view',
                '@nuxt/ui > prosemirror-gapcursor',
            ],
        },
    },

    nitro: {
        preset: 'cloudflare_module',
        cloudflare: {
            deployConfig: true,
            nodeCompat: true,
            wrangler: {
                name: 'liry24-com',
                routes: [
                    {
                        pattern: withoutProtocol(baseURL),
                        custom_domain: true,
                    },
                ],
                d1_databases: [
                    {
                        binding: 'DB',
                        database_name: process.env.D1_NAME!,
                        database_id: process.env.D1_ID!,
                    },
                ],
                r2_buckets: [
                    {
                        binding: 'R2',
                        bucket_name: process.env.R2_BUCKET!,
                    },
                ],
                kv_namespaces: [
                    {
                        binding: 'KV',
                        id: process.env.KV_ID!,
                    },
                ],
                vars: {
                    NUXT_PUBLIC_SITE_URL: baseURL,
                },
            },
        },
        compressPublicAssets: true,
        storage: {
            auth: {
                driver: 'cloudflare-kv-binding',
                binding: 'AUTH_KV',
            },
        },
        devStorage: {
            auth: {
                driver: 'fs-lite',
                base: '.data/devStorage/auth',
            },
        },
        experimental: {
            asyncContext: true,
        },
    },

    typescript: {
        // typeCheck: true,
        tsConfig: {
            include: ['../drizzle.config.*'],
            compilerOptions: {
                noUncheckedIndexedAccess: true,
            },
        },
    },

    experimental: {
        crossOriginPrefetch: true,
        extractAsyncDataHandlers: true,
        inlineRouteRules: true,
        sharedPrerenderData: true,
        typescriptPlugin: true,
        nitroAutoImports: true,
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

    image: {
        provider: 'cloudflare',
        cloudflare: {
            baseURL,
        },
        domains: [parseURL(process.env.R2_DOMAIN).host!, 'avatars.githubusercontent.com'],
    },

    sitemap: {
        sitemaps: true,
        sources: ['/api/__sitemap__/urls'],
    },
})
