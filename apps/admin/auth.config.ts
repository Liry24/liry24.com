import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { mcp } from '@better-auth/mcp'
import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth'
import { admin, jwt, lastLoginMethod, oAuthProxy } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/node-sqlite'

import * as schema from './database/schema'

const siteURL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://admin.liry24.com').replace(/\/$/u, '')

const mcpPlugin = mcp({
    loginPage: '/login',
    consentPage: '/oauth/consent',
    resource: `${siteURL}/mcp`,
})
const { init: _init, ...mcpSchemaPlugin } = mcpPlugin

export const auth = betterAuth({
    appName: 'liry24',
    secret: process.env.BETTER_AUTH_SECRET,

    baseURL: {
        allowedHosts: ['localhost:3000', '127.0.0.1:3000', 'admin.liry24.com', '*.workers.dev'],
        fallback: 'https://admin.liry24.com',
    },
    trustedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://admin.liry24.com'],

    database: drizzleAdapter(drizzle('.data/database.db'), {
        provider: 'sqlite',
        schema,
        transaction: false,
        usePlural: true,
    }),

    account: {
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
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            mapProfileToUser: async (profile) => ({
                email: profile.email,
                username: profile.login,
                displayUsername: profile.login,
                name: profile.name,
                image: profile.avatar_url,
                emailVerified: true,
            }),
            disableSignUp: process.env.ALLOW_SIGNUP !== 'true',
        },
        vercel: {
            clientId: process.env.VERCEL_CLIENT_ID!,
            clientSecret: process.env.VERCEL_CLIENT_SECRET,
            mapProfileToUser: async (profile) => ({
                email: profile.email,
                username: profile.preferred_username,
                displayUsername: profile.preferred_username,
                name: profile.name,
                image: profile.picture,
                emailVerified: true,
            }),
            disableSignUp: process.env.ALLOW_SIGNUP !== 'true',
        },
    },

    plugins: [
        passkey(),
        lastLoginMethod(),
        admin(),
        oAuthProxy({
            productionURL: 'https://admin.liry24.com',
            secret: process.env.OAUTH_PROXY_SECRET ?? process.env.BETTER_AUTH_SECRET,
            maxAge: 60,
        }),
        jwt({
            disableSettingJwtHeader: true,
            jwks: {
                rotationInterval: 60 * 60 * 24 * 30,
                gracePeriod: 60 * 60 * 24 * 30,
            },
        }),
        mcpSchemaPlugin,
        cimd({
            fetchClientMetadataResource,
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

    advanced: {
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
