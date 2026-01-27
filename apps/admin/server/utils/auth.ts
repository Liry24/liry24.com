import { db, schema } from '#imports'
import { passkey } from '@better-auth/passkey'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, lastLoginMethod } from 'better-auth/plugins'

const config = useRuntimeConfig()

export const auth = betterAuth({
    baseURL: config.public.domain,
    secret: config.betterAuth.secret,
    appName: 'liry24',

    database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema,
        usePlural: true,
    }),

    trustedOrigins: [
        config.public.domain,
        'https://liry24com-*-liria.vercel.app',
        'http://localhost:*',
    ],

    rateLimit: {
        enabled: true,
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
            clientId: config.github.clientId,
            clientSecret: config.github.clientSecret,
            mapProfileToUser: async (profile) => ({
                email: profile.email,
                username: profile.login,
                displayUsername: profile.login,
                name: profile.name,
                image: profile.avatar_url,
                emailVerified: true,
            }),
            disableSignUp: config.allowSignup !== 'true',
        },
        vercel: {
            clientId: config.vercel.clientId,
            clientSecret: config.vercel.clientSecret,
            mapProfileToUser: async (profile) => ({
                email: profile.email,
                username: profile.preferred_username,
                displayUsername: profile.preferred_username,
                name: profile.name,
                image: profile.picture,
                emailVerified: true,
            }),
            disableSignUp: config.allowSignup !== 'true',
        },
    },

    account: {
        updateAccountOnSignIn: true,
        accountLinking: {
            enabled: true,
            trustedProviders: ['github'],
            allowDifferentEmails: true,
        },
    },

    plugins: [passkey(), lastLoginMethod(), admin()],

    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
        freshAge: 0,
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        },
    },

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

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>
