import type { R2Bucket } from '@cloudflare/workers-types'
import {
    localhostAllowedOrigins,
    originValidationResponse,
    type AuthInfo,
} from '@modelcontextprotocol/server'
import type { Database } from '@repo/database'
import { createDpopReplayStore } from 'better-auth/oauth2'
import type { JWTPayload } from 'jose'

import { useDB } from '../utils/database'
import { liry24McpResource, protectLiry24Mcp } from '../utils/mcpAuth'
import type { PostAutomation, PostPublishWorkflow, PostReviewQueue } from '../utils/postService'

const siteURL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://admin.liry24.com').replace(/\/$/u, '')

const jsonRpcError = (status: number, message: string) =>
    new Response(
        JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: status === 403 ? -32003 : -32001, message },
        }),
        {
            status,
            headers: { 'content-type': 'application/json' },
        },
    )

const corsHeaders = (request: Request) => {
    const origin = request.headers.get('origin')
    const requestedHeaders = request.headers.get('access-control-request-headers')
    const allowHeaders = new Set([
        'authorization',
        'content-type',
        'dpop',
        'mcp-protocol-version',
        'mcp-session-id',
    ])
    for (const header of requestedHeaders?.split(',') ?? []) {
        const normalized = header.trim().toLowerCase()
        if (normalized.startsWith('mcp-param-')) allowHeaders.add(normalized)
    }

    return {
        ...(origin ? { 'access-control-allow-origin': origin } : {}),
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': [...allowHeaders].join(', '),
        'access-control-expose-headers': 'MCP-Protocol-Version, MCP-Session-Id, WWW-Authenticate',
        'access-control-max-age': '600',
        vary: 'Origin, Access-Control-Request-Headers',
    }
}

const withCors = (response: Response, request: Request) => {
    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(corsHeaders(request))) headers.set(name, value)
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

const createProtectedMcp = (
    auth: Auth,
    database: Database,
    r2: R2Bucket,
    imageBaseUrl: string,
    automation: PostAutomation,
) => {
    const handler = async (request: Request, jwt: JWTPayload) => {
        const userId = typeof jwt.sub === 'string' ? jwt.sub : null
        const clientId =
            typeof jwt.client_id === 'string'
                ? jwt.client_id
                : typeof jwt.azp === 'string'
                  ? jwt.azp
                  : null
        const sessionId = typeof jwt.sid === 'string' ? jwt.sid : null
        const scopes =
            typeof jwt.scope === 'string'
                ? jwt.scope.split(/\s+/u).filter(Boolean)
                : Array.isArray(jwt.scope)
                  ? jwt.scope.filter((scope): scope is string => typeof scope === 'string')
                  : []

        if (!userId || !clientId || !sessionId)
            return jsonRpcError(403, 'The access token is missing required MCP claims')

        const [user, session] = await Promise.all([
            database.query.users.findFirst({
                columns: { id: true, role: true, banned: true, banExpires: true },
                where: { id: { eq: userId } },
            }),
            database.query.sessions.findFirst({
                columns: { id: true, userId: true, expiresAt: true },
                where: { id: { eq: sessionId } },
            }),
        ])

        if (
            !user ||
            user.role !== 'admin' ||
            (user.banned && (!user.banExpires || user.banExpires > new Date()))
        )
            return jsonRpcError(403, 'An active administrator account is required')
        if (!session || session.userId !== userId || session.expiresAt <= new Date())
            return jsonRpcError(401, 'The Better Auth session is no longer active')

        const authorization = request.headers.get('authorization') ?? ''
        const authInfo: AuthInfo = {
            token: authorization.replace(/^Bearer\s+/iu, ''),
            clientId,
            scopes,
            expiresAt: typeof jwt.exp === 'number' ? jwt.exp : undefined,
            resource: new URL(liry24McpResource),
            extra: {
                userId,
                sessionId,
                headers: request.headers,
                database,
                r2,
                imageBaseUrl,
                auth,
                automation,
            },
        }
        return liry24McpHandler.fetch(request, { authInfo })
    }

    return auth.$context.then(({ internalAdapter }) =>
        protectLiry24Mcp(handler, createDpopReplayStore(internalAdapter)),
    )
}

export default eventHandler(async (event) => {
    const request = toWebRequest(event)
    const originRejected = originValidationResponse(request, [
        new URL(siteURL).hostname,
        ...localhostAllowedOrigins(),
    ])
    if (originRejected) return withCors(originRejected, request)
    if (request.method === 'OPTIONS')
        return new Response(null, {
            status: 204,
            headers: corsHeaders(request),
        })
    if (request.method !== 'POST')
        return new Response(null, {
            status: 405,
            headers: { ...corsHeaders(request), allow: 'POST, OPTIONS' },
        })

    const environment = getCloudflareEnvironment<{
        R2: R2Bucket
        POST_REVIEW_QUEUE?: PostReviewQueue
        POST_PUBLISH_WORKFLOW?: PostPublishWorkflow
    }>(event)
    const database = useDB()
    const auth = await getAuth()
    const r2 = environment.R2
    const imageBaseUrl = useRuntimeConfig(event).public.imagesDomain
    const protectedMcp = await createProtectedMcp(auth, database, r2, imageBaseUrl, {
        reviewQueue: environment.POST_REVIEW_QUEUE,
        publishWorkflow: environment.POST_PUBLISH_WORKFLOW,
    })
    return withCors(await protectedMcp(request), request)
})
