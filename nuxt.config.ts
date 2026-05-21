import { parseURL } from 'ufo'

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
        '@nuxt/ui',
        '@nuxt/image',
        '@nuxt/content',
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
            imagesDomain: process.env.TIGRIS_STORAGE_DOMAIN,
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
        tigrisStorage: {
            accessKeyId: process.env.TIGRIS_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
            bucket: process.env.TIGRIS_STORAGE_BUCKET,
            domain: process.env.TIGRIS_STORAGE_DOMAIN,
        },
        turso: {
            databaseUrl: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
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
                // 'drizzle-orm',
                '@nuxt/ui > prosemirror-state',
                '@nuxt/ui > prosemirror-transform',
                '@nuxt/ui > prosemirror-model',
                '@nuxt/ui > prosemirror-view',
                '@nuxt/ui > prosemirror-gapcursor',
            ],
        },
    },

    nitro: {
        preset: 'vercel',
        compressPublicAssets: true,
        vercel: {
            config: {
                images: {
                    minimumCacheTTL: 2678400, // 31 days
                },
            },
        },
        // externals: {
        //     inline: ['drizzle-orm'],
        // },
        storage: {
            auth: {
                driver: 'vercel-runtime-cache',
                tags: ['auth'],
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

    content: {
        build: {
            markdown: {
                remarkPlugins: {
                    'remark-breaks': {},
                },
            },
        },
        experimental: { sqliteConnector: 'native' },
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
        domains: [
            parseURL(process.env.TIGRIS_STORAGE_DOMAIN).host!,
            'avatars.githubusercontent.com',
        ],
    },

    sitemap: {
        sitemaps: true,
        sources: ['/api/__sitemap__/urls'],
    },
})
