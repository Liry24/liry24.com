import { parseURL, withoutProtocol } from 'ufo'

const baseURL = import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://liry24.com'
const imagesDomain = 'https://images.liry24.com'
const title = 'Liry24'

export default defineNuxtConfig({
    extends: ['../../layers/base'],

    modules: ['@nuxtjs/sitemap', 'nuxt-og-image', 'motion-v/nuxt'],

    experimental: {
        sharedPrerenderData: true,
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

    nitro: {
        cloudflare: {
            dev: {
                configPath: './.data/wrangler.dev.jsonc',
                persistDir: './.data/wrangler/state/v3',
            },
            wrangler: {
                name: 'liry24-com',
                assets: {
                    not_found_handling: '404-page',
                },
                routes: [{ pattern: withoutProtocol(baseURL), custom_domain: true }],
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
        prerender: {
            crawlLinks: false,
            failOnError: true,
        },
    },

    typescript: {
        tsConfig: {
            include: ['../scripts/*'],
        },
    },

    app: {
        head: { title },
    },

    fonts: {
        families: [
            {
                name: 'Special Gothic Expanded One',
                weights: [400],
                provider: 'google',
                preload: true,
                global: true,
            },
        ],
    },

    sitemap: {
        zeroRuntime: true,
        sources: ['/api/__sitemap__/urls'],
    },

    site: {
        url: baseURL,
    },

    $production: {
        image: {
            provider: 'cloudflare',
            cloudflare: { baseURL },
            domains: [parseURL(process.env.R2_DOMAIN).host!, 'avatars.githubusercontent.com'],
        },
    },
})
