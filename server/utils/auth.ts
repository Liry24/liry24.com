import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth/minimal'
import { admin, lastLoginMethod } from 'better-auth/plugins'

import { schema } from '../../database'

export const auth = betterAuth({
    appName: 'liry24',
    secret: process.env.BETTER_AUTH_SECRET,

    baseURL: {
        allowedHosts: ['localhost:3000', 'liry24.com', '*.workers.dev'],
        fallback: 'https://liry24.com',
    },

    database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema,
        transaction: false,
        usePlural: true,
    }),

    account: {
        storeStateStrategy: 'cookie',
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

    plugins: [passkey(), lastLoginMethod(), admin()],

    user: {
        changeEmail: {
            enabled: false,
        },
        deleteUser: {
            enabled: false,
        },
    },

    advanced: {
        backgroundTasks: {
            handler: (promise) => useEvent().context.cloudflare.context.waitUntil(promise),
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

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>

export const getAuth = async () => auth
