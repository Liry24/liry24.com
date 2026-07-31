import { parseURL, withoutProtocol } from 'ufo'

const baseURL = import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://liry24.com'
const imagesDomain = 'https://images.liry24.com'
const productionGithubClientId = 'Ov23liCgRvti1lBwREzb'
const title = 'Liry24'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-07-30',

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
            siteURL: baseURL,
            imagesDomain,
        },
        aiGateway: {
            apiKey: process.env.AI_GATEWAY_API_KEY,
        },
        allowSignup: process.env.ALLOW_SIGNUP,
        betterAuth: {
            secret: process.env.BETTER_AUTH_SECRET,
        },
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
        plugins: ['~~/server/plugins/00.reflect-metadata'],
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
                d1_databases: [
                    {
                        binding: 'DB',
                        database_name: process.env.D1_NAME!,
                        database_id: process.env.D1_ID!,
                        migrations_dir: '../../drizzle',
                        migrations_pattern: '../../drizzle/*/migration.sql',
                    } as {
                        binding: string
                        database_name: string
                        database_id: string
                        migrations_dir: string
                        migrations_pattern: string
                    },
                ],
                r2_buckets: [
                    {
                        binding: 'R2',
                        bucket_name: process.env.R2_BUCKET!,
                    },
                ],
                ai: {
                    binding: 'AI',
                },
                vars: {
                    NUXT_PUBLIC_SITE_URL: baseURL,
                    GITHUB_CLIENT_ID: productionGithubClientId,
                    D1_NAME: 'liry24-com',
                    R2_BUCKET: 'liry24-com',
                    R2_DOMAIN: imagesDomain,
                },
                observability: {
                    logs: {
                        enabled: true,
                        invocation_logs: true,
                    },
                },
                triggers: {
                    crons: ['* * * * *'],
                },
                // @ts-expect-error Nitro's bundled Wrangler types do not include Workers Caching yet.
                cache: {
                    enabled: true,
                    cross_version_cache: false,
                },
            },
        },
        compressPublicAssets: true,
        experimental: {
            asyncContext: true,
            tasks: true,
        },
        scheduledTasks: {
            '* * * * *': ['posts:maintenance'],
        },
    },

    typescript: {
        // typeCheck: true,
        tsConfig: {
            include: ['../drizzle.config.*', '../database/*'],
            compilerOptions: {
                noUncheckedIndexedAccess: true,
                types: ['@cloudflare/workers-types'],
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
