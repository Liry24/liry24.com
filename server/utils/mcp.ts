import type { R2Bucket } from '@cloudflare/workers-types'
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import type { Database } from '../../database'
import {
    applyAdminPlan,
    enforceMcpRateLimit,
    issueAdminUploadUrl,
    prepareAdminPlan,
    queryAdminResources,
    type AdminActor,
} from './adminMcpService'
import {
    adminApplyInputSchema,
    adminIssueUploadInputSchema,
    adminPrepareInputSchema,
    adminQueryInputSchema,
} from './adminOperations'
import type { Auth } from './auth'

const queryOutputSchema = z.object({
    resultType: z.literal('query'),
    resource: z.string(),
    items: z.array(z.unknown()),
    nextCursor: z.string().nullable(),
})

const prepareOutputSchema = z.object({
    resultType: z.literal('prepared_plan'),
    planId: z.uuid(),
    expiresAt: z.iso.datetime(),
    operationCount: z.number().int(),
    diffs: z.array(z.unknown()),
    confirmationRequired: z.literal(true),
})

const applyOutputSchema = z.object({
    resultType: z.literal('apply_result'),
    planId: z.uuid(),
    status: z.enum(['applied', 'partially_failed']),
    d1Applied: z.boolean(),
    operations: z.array(z.unknown()),
})

const uploadOutputSchema = z.object({
    resultType: z.literal('upload_url'),
    key: z.string(),
    uploadInfo: z.unknown(),
    publicUrl: z.string(),
    expiresInSeconds: z.number().int(),
    maxBytes: z.number().int(),
    auditId: z.uuid(),
})

const toolResult = <T extends Record<string, unknown>>(output: T) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(output) }],
    structuredContent: output,
})

const requestContext = (authInfo: { clientId: string; extra?: Record<string, unknown> }) => {
    const userId = authInfo.extra?.userId
    const headers = authInfo.extra?.headers
    const database = authInfo.extra?.database as Database | undefined
    const r2 = authInfo.extra?.r2 as R2Bucket | undefined
    const imageBaseUrl = authInfo.extra?.imageBaseUrl
    const auth = authInfo.extra?.auth as Auth | undefined
    if (
        typeof userId !== 'string' ||
        !(headers instanceof Headers) ||
        !database ||
        !r2 ||
        typeof imageBaseUrl !== 'string' ||
        !auth
    )
        throw new Error('Validated MCP actor context is unavailable')
    return {
        actor: { userId, clientId: authInfo.clientId, headers } satisfies AdminActor,
        database,
        r2,
        imageBaseUrl,
        auth,
    }
}

export const liry24McpHandler = createMcpHandler(
    ({ authInfo }) => {
        if (!authInfo) throw new Error('MCP authentication is required')
        const { actor, database, r2, imageBaseUrl, auth } = requestContext(authInfo)
        const server = new McpServer(
            {
                name: 'liry24-admin',
                version: '1.0.0',
            },
            {
                instructions:
                    'Use query before preparing changes. Prepare returns a diff and never changes business data. Show that diff to the administrator and call apply only after explicit confirmation.',
            },
        )

        server.registerTool(
            'liry24_admin_query',
            {
                title: 'Query Liry24 admin resources',
                description:
                    'Read posts, portfolio resources, users, reviews, or audit events. Secrets and session tokens are never returned.',
                inputSchema: adminQueryInputSchema,
                outputSchema: queryOutputSchema,
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
            },
            async (input) => {
                await enforceMcpRateLimit(database, actor, 'read')
                const result = await queryAdminResources(database, input)
                return toolResult({
                    resultType: 'query' as const,
                    resource: input.resource,
                    ...JSON.parse(JSON.stringify(result)),
                })
            },
        )

        server.registerTool(
            'liry24_admin_prepare',
            {
                title: 'Prepare Liry24 admin changes',
                description:
                    'Validate up to 50 operations and save a ten-minute, actor-bound plan. This does not mutate business resources. Present every returned diff for explicit approval.',
                inputSchema: adminPrepareInputSchema,
                outputSchema: prepareOutputSchema,
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: false,
                },
            },
            async ({ operations }) => {
                await enforceMcpRateLimit(database, actor, 'read')
                const prepared = await prepareAdminPlan(database, actor, operations)
                return toolResult({
                    resultType: 'prepared_plan' as const,
                    ...prepared,
                })
            },
        )

        server.registerTool(
            'liry24_admin_apply',
            {
                title: 'Apply a confirmed Liry24 admin plan',
                description:
                    'Apply an unexpired plan created by the same administrator and OAuth client. Call only after the administrator explicitly confirms the prepared diff.',
                inputSchema: adminApplyInputSchema,
                outputSchema: applyOutputSchema,
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true,
                    openWorldHint: true,
                },
            },
            async ({ planId }) => {
                await enforceMcpRateLimit(database, actor, 'apply')
                const result = await applyAdminPlan(database, actor, planId, r2, imageBaseUrl, auth)
                const failed = result.operations.some((item) => item.status === 'failed')
                return toolResult({
                    resultType: 'apply_result' as const,
                    planId,
                    status: failed ? ('partially_failed' as const) : ('applied' as const),
                    ...result,
                })
            },
        )

        server.registerTool(
            'liry24_admin_issue_upload_url',
            {
                title: 'Issue a constrained Liry24 upload URL',
                description:
                    'Issue a five-minute R2 upload contract for an allowed image key, MIME type, and declared size up to 10 MiB.',
                inputSchema: adminIssueUploadInputSchema,
                outputSchema: uploadOutputSchema,
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: true,
                },
            },
            async (input) => {
                await enforceMcpRateLimit(database, actor, 'apply')
                const result = await issueAdminUploadUrl(database, actor, input)
                return toolResult({
                    resultType: 'upload_url' as const,
                    ...result,
                })
            },
        )

        return server
    },
    {
        legacy: 'stateless',
        responseMode: 'json',
        onerror: (error) => {
            console.error(
                JSON.stringify({
                    message: 'MCP request failed',
                    error: error.message,
                }),
            )
        },
    },
)
