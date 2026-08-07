import { cimd } from '@better-auth/cimd'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { mcp } from '@better-auth/mcp'
import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth/minimal'
import { admin, jwt, lastLoginMethod, oAuthProxy } from 'better-auth/plugins'

import { schema, useDB, type Database } from '../../database'
import { createCimdMetadataResourceFetch, type CimdMetadataFetcher } from './cimdFetch'
import { getCloudflareEnvironment } from './cloudflareContext'

const siteURL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://admin.liry24.com').replace(/\/$/u, '')
const mcpResource = `${siteURL}/mcp`

type AuthEnvironment = {
    BETTER_AUTH_SECRET?: string
    OAUTH_PROXY_SECRET?: string
    GITHUB_CLIENT_ID?: string
    GITHUB_CLIENT_SECRET?: string
    VERCEL_CLIENT_ID?: string
    VERCEL_CLIENT_SECRET?: string
    ALLOW_SIGNUP?: string
}

export const createAuth = (
    database: Database,
    waitUntil: (promise: Promise<unknown>) => void,
    environment: AuthEnvironment = process.env as AuthEnvironment,
    cimdMetadataFetcher?: CimdMetadataFetcher,
) =>
    betterAuth({
        appName: 'liry24',
        secret: environment.BETTER_AUTH_SECRET,

        baseURL: {
            allowedHosts: ['localhost:3000', '127.0.0.1:3000', 'admin.liry24.com', '*.workers.dev'],
            fallback: 'https://admin.liry24.com',
        },
        trustedOrigins: [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://admin.liry24.com',
        ],

        database: drizzleAdapter(database, {
            provider: 'sqlite',
            schema,
            transaction: false,
            usePlural: true,
        }),

        account: {
            // Persist concurrent OAuth states server-side so one browser tab
            // cannot overwrite another tab's state cookie.
            storeStateStrategy: 'database',
            updateAccountOnSignIn: true,
            accountLinking: {
                enabled: true,
                trustedProviders: ['github'],
                allowDifferentEmails: true,
            },
        },

        session: {
            expiresIn: 60 * 60 * 24 * 30,
            updateAge: 60 * 60 * 24,
            freshAge: 0,
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5,
            },
        },

        rateLimit: {
            enabled: true,
            storage: 'database',
            window: 60,
            max: 100,
            customRules: {
                '/sign-in/social': {
                    window: 60,
                    max: 10,
                },
                '/get-session': {
                    window: 60,
                    max: 200,
                },
            },
        },

        emailAndPassword: {
            enabled: false,
        },

        socialProviders: {
            github: {
                clientId: environment.GITHUB_CLIENT_ID!,
                clientSecret: environment.GITHUB_CLIENT_SECRET,
                mapProfileToUser: async (profile) => ({
                    email: profile.email,
                    username: profile.login,
                    displayUsername: profile.login,
                    name: profile.name,
                    image: profile.avatar_url,
                    emailVerified: true,
                }),
                disableSignUp: environment.ALLOW_SIGNUP !== 'true',
            },
            vercel: {
                clientId: environment.VERCEL_CLIENT_ID!,
                clientSecret: environment.VERCEL_CLIENT_SECRET,
                mapProfileToUser: async (profile) => ({
                    email: profile.email,
                    username: profile.preferred_username,
                    displayUsername: profile.preferred_username,
                    name: profile.name,
                    image: profile.picture,
                    emailVerified: true,
                }),
                disableSignUp: environment.ALLOW_SIGNUP !== 'true',
            },
        },

        plugins: [
            passkey(),
            lastLoginMethod(),
            admin(),
            oAuthProxy({
                productionURL: 'https://admin.liry24.com',
                secret: environment.OAUTH_PROXY_SECRET ?? environment.BETTER_AUTH_SECRET,
                maxAge: 60,
            }),
            jwt({
                disableSettingJwtHeader: true,
                jwks: {
                    rotationInterval: 60 * 60 * 24 * 30,
                    gracePeriod: 60 * 60 * 24 * 30,
                },
            }),
            mcp({
                loginPage: '/login',
                consentPage: '/oauth/consent',
                resource: mcpResource,
                scopes: ['liry24:admin', 'offline_access'],
                cachedResources: new Set([mcpResource]),
                enforcePerClientResources: false,
                accessTokenExpiresIn: 60 * 15,
                refreshTokenExpiresIn: 60 * 60 * 24 * 30,
                refreshTokenReuseInterval: 30,
                grantTypes: ['authorization_code', 'refresh_token'],
                allowDynamicClientRegistration: true,
                allowUnauthenticatedClientRegistration: true,
                clientRegistrationDefaultScopes: ['liry24:admin', 'offline_access'],
                clientRegistrationAllowedScopes: ['liry24:admin', 'offline_access'],
                advertisedMetadata: {
                    scopes_supported: ['liry24:admin', 'offline_access'],
                },
                silenceWarnings: {
                    oauthAuthServerConfig: true,
                },
            }),
            cimd({
                fetchClientMetadataResource: createCimdMetadataResourceFetch(cimdMetadataFetcher),
                metadataProfile: 'mcp-2026-07-28',
                metadataRevalidationInterval: '60m',
            }),
        ],

        user: {
            changeEmail: {
                enabled: false,
            },
            deleteUser: {
                enabled: false,
            },
        },

        databaseHooks: {
            user: {
                create: {
                    before: async (user, ctx) => {
                        const existingUser = await ctx?.context.adapter.findMany({
                            model: 'user',
                            limit: 1,
                        })
                        if (!existingUser?.length) return { data: { ...user, role: 'admin' } }
                        return { data: user }
                    },
                },
            },
        },

        advanced: {
            join: true,
            backgroundTasks: {
                handler: waitUntil,
            },
            ipAddress: {
                ipAddressHeaders: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'],
                disableIpTracking: false,
            },
            useSecureCookies: process.env.NODE_ENV === 'production',
            disableCSRFCheck: false,
            defaultCookieAttributes: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            },
        },
    })

export type Auth = ReturnType<typeof createAuth>
type RequestAuthContext = { liry24Auth?: Auth }

export type Session = Awaited<ReturnType<Auth['api']['getSession']>>

export const getAuth = async () => {
    const event = useEvent()
    const context = event.context as typeof event.context & RequestAuthContext
    const workerEnvironment = getCloudflareEnvironment<
        AuthEnvironment & { CIMD_FETCHER?: CimdMetadataFetcher }
    >(event)
    context.liry24Auth ??= createAuth(
        useDB(),
        (promise) => event.waitUntil(promise),
        {
            BETTER_AUTH_SECRET:
                workerEnvironment.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
            OAUTH_PROXY_SECRET:
                workerEnvironment.OAUTH_PROXY_SECRET ?? process.env.OAUTH_PROXY_SECRET,
            GITHUB_CLIENT_ID: workerEnvironment.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID,
            GITHUB_CLIENT_SECRET:
                workerEnvironment.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET,
            VERCEL_CLIENT_ID: workerEnvironment.VERCEL_CLIENT_ID ?? process.env.VERCEL_CLIENT_ID,
            VERCEL_CLIENT_SECRET:
                workerEnvironment.VERCEL_CLIENT_SECRET ?? process.env.VERCEL_CLIENT_SECRET,
            ALLOW_SIGNUP: workerEnvironment.ALLOW_SIGNUP ?? process.env.ALLOW_SIGNUP,
        },
        workerEnvironment.CIMD_FETCHER,
    )
    return context.liry24Auth
}
