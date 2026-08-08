import { createMcpProtectedRequestHandler } from '@better-auth/mcp'
import type { DpopReplayStore } from 'better-auth/oauth2'
import type { JWTPayload } from 'jose'

const siteURL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://admin.liry24.com').replace(/\/$/u, '')

export const liry24McpResource = `${siteURL}/mcp`

export const protectLiry24Mcp = (
    handler: (request: Request, accessTokenClaims: JWTPayload) => Promise<Response>,
    replayStore?: DpopReplayStore,
) =>
    createMcpProtectedRequestHandler(
        {
            issuer: `${siteURL}/api/auth`,
            audience: liry24McpResource,
            jwksUrl: `${siteURL}/api/auth/jwks`,
            requiredScopes: ['liry24:admin'],
            dpop: { replayStore },
        },
        handler,
    )
