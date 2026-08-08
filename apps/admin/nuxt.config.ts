import { parseURL } from 'ufo'

const baseURL = import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://admin.liry24.com'
const imagesDomain = 'https://images.liry24.com'
const title = 'Liry24 Admin'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-07-30',

    future: { compatibilityVersion: 5 },

    devtools: { enabled: true, timeline: { enabled: true } },

    modules: [
        '@comark/nuxt',
        '@nuxt/ui',
        '@nuxt/image',
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
        allowSignup: process.env.ALLOW_SIGNUP === 'true',
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
        '/**': { appMiddleware: 'admin', appLayout: 'admin' },
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
        plugins: [
            '~~/server/plugins/00.reflect-metadata',
            '~~/server/plugins/01.cloudflare-context',
        ],
        cloudflare: {
            deployConfig: true,
            nodeCompat: true,
            dev: {
                configPath: './.data/wrangler.dev.jsonc',
                persistDir: './.data/wrangler/state/v3',
            },
            wrangler: {
                name: 'liry24-com-admin',
                routes: [
                    {
                        pattern: 'admin.liry24.com',
                        custom_domain: true,
                    },
                ],
                d1_databases: [
                    {
                        binding: 'DB',
                        database_name: process.env.D1_NAME!,
                        database_id: process.env.D1_ID!,
                        migrations_dir: '../../../../drizzle',
                        migrations_pattern: '../../../../drizzle/*/migration.sql',
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
                queues: {
                    producers: [
                        {
                            binding: 'POST_REVIEW_QUEUE',
                            queue: 'liry24-post-reviews',
                        },
                    ],
                    consumers: [
                        {
                            queue: 'liry24-post-reviews',
                            max_batch_size: 1,
                            max_retries: 4,
                        },
                    ],
                },
                workflows: [
                    {
                        binding: 'POST_PUBLISH_WORKFLOW',
                        name: 'liry24-post-publish-v1',
                        class_name: 'PublishPostWorkflow',
                        script_name: 'liry24-post-publisher',
                    },
                ],
                services: [
                    {
                        binding: 'CIMD_FETCHER',
                        service: 'liry24-cimd-fetcher',
                        experimental_remote: true,
                    },
                ],
                vars: {
                    NUXT_PUBLIC_SITE_URL: baseURL,
                    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
                    VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID,
                    D1_NAME: 'liry24-com',
                    R2_BUCKET: 'liry24-com',
                    R2_DOMAIN: imagesDomain,
                    ALLOW_SIGNUP: process.env.ALLOW_SIGNUP || 'false',
                },
                observability: {
                    logs: {
                        enabled: true,
                        invocation_logs: true,
                    },
                },
            },
        },
        compressPublicAssets: true,
        experimental: {
            asyncContext: true,
        },
    },

    typescript: {
        tsConfig: {
            include: ['../auth.config.ts'],
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
