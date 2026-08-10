import { createError, type H3Event } from 'h3'
import z from 'zod'

import { getCloudflareEnvironment } from './cloudflareContext'

const buildStatuses = ['queued', 'initializing', 'running', 'stopped'] as const
const buildOutcomes = ['success', 'fail', 'skipped', 'cancelled', 'terminated'] as const
const buildTriggers = ['push', 'pull_request', 'manual', 'api', 'deploy_hook'] as const

const rawBuildSchema = z.object({
    build_uuid: z.string().uuid(),
    status: z.string().optional(),
    build_outcome: z.string().nullish(),
    created_on: z.string().nullish(),
    initializing_on: z.string().nullish(),
    running_on: z.string().nullish(),
    stopped_on: z.string().nullish(),
    build_trigger_metadata: z
        .object({
            branch: z.string().nullish(),
            build_trigger_source: z.string().nullish(),
        })
        .nullish(),
    trigger: z.object({ external_script_id: z.string().nullish() }).nullish(),
})

const buildResponseSchema = z.object({ success: z.literal(true), result: rawBuildSchema })
const buildListResponseSchema = z.object({
    success: z.literal(true),
    result: z.array(rawBuildSchema),
})
const deployHookResponseSchema = z.object({
    success: z.literal(true),
    result: z.object({
        build_uuid: z.string().uuid(),
        status: z.string().optional(),
        created_on: z.string().nullish(),
        already_exists: z.boolean().optional(),
    }),
})
const cancelResponseSchema = z.object({
    success: z.literal(true),
    result: z.object({ build_uuid: z.string().uuid() }),
})

type RawBuild = z.infer<typeof rawBuildSchema>
type Fetcher = typeof fetch

export type SiteBuild = {
    id: string
    status: (typeof buildStatuses)[number] | 'unknown'
    outcome: (typeof buildOutcomes)[number] | null | 'unknown'
    trigger: (typeof buildTriggers)[number] | 'unknown'
    branch: string | null
    createdAt: string | null
    initializingAt: string | null
    runningAt: string | null
    stoppedAt: string | null
    canCancel: boolean
}

export type SiteBuildConfig = {
    accountId: string
    apiToken: string
    workerTag: string
}

const includes = <T extends readonly string[]>(values: T, value: unknown): value is T[number] =>
    typeof value === 'string' && values.includes(value)

export const normalizeSiteBuild = (build: RawBuild): SiteBuild => {
    const status = includes(buildStatuses, build.status) ? build.status : 'unknown'
    const outcome = build.build_outcome
        ? includes(buildOutcomes, build.build_outcome)
            ? build.build_outcome
            : 'unknown'
        : null
    const trigger = includes(buildTriggers, build.build_trigger_metadata?.build_trigger_source)
        ? build.build_trigger_metadata.build_trigger_source
        : 'unknown'

    return {
        id: build.build_uuid,
        status,
        outcome,
        trigger,
        branch: build.build_trigger_metadata?.branch ?? null,
        createdAt: build.created_on ?? null,
        initializingAt: build.initializing_on ?? null,
        runningAt: build.running_on ?? null,
        stoppedAt: build.stopped_on ?? null,
        canCancel: status === 'queued' || status === 'initializing' || status === 'running',
    }
}

export const getSiteBuildConfig = (event: H3Event): SiteBuildConfig => {
    const environment = getCloudflareEnvironment<{
        CLOUDFLARE_ACCOUNT_ID?: string
        SITE_DEPLOY_API_TOKEN?: string
        SITE_DEPLOY_WORKER_TAG?: string
    }>(event)
    const config = {
        accountId: environment.CLOUDFLARE_ACCOUNT_ID,
        apiToken: environment.SITE_DEPLOY_API_TOKEN,
        workerTag: environment.SITE_DEPLOY_WORKER_TAG,
    }

    if (!config.accountId || !config.apiToken || !config.workerTag)
        throw createError({
            statusCode: 503,
            statusMessage: 'Site build monitoring is not configured',
        })

    return config as SiteBuildConfig
}

export const getSiteDeployHook = (event: H3Event) => {
    const deployHook = getCloudflareEnvironment<{ SITE_DEPLOY_HOOK_URL?: string }>(
        event,
    ).SITE_DEPLOY_HOOK_URL
    if (!deployHook)
        throw createError({ statusCode: 503, statusMessage: 'Site build hook is not configured' })
    return deployHook
}

const requestCloudflare = async <T extends z.ZodTypeAny>(
    url: string,
    schema: T,
    init: RequestInit,
    fetcher: Fetcher,
    conflictStatuses: number[] = [],
): Promise<z.output<T>> => {
    let response: Response
    try {
        response = await fetcher(url, init)
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'Cloudflare request failed' })
    }

    if (!response.ok) {
        console.error(
            JSON.stringify({ message: 'Cloudflare request failed', status: response.status }),
        )
        throw createError({
            statusCode: conflictStatuses.includes(response.status) ? 409 : 502,
            statusMessage: conflictStatuses.includes(response.status)
                ? 'The site build can no longer be canceled'
                : 'Cloudflare request failed',
        })
    }

    const parsed = schema.safeParse(await response.json().catch(() => null))
    if (!parsed.success)
        throw createError({
            statusCode: 502,
            statusMessage: 'Cloudflare returned an invalid response',
        })
    return parsed.data
}

const apiRequest = <T extends z.ZodTypeAny>(
    config: SiteBuildConfig,
    path: string,
    schema: T,
    init: RequestInit = {},
    fetcher: Fetcher = fetch,
    conflictStatuses: number[] = [],
) =>
    requestCloudflare(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}${path}`,
        schema,
        {
            ...init,
            headers: { Authorization: `Bearer ${config.apiToken}`, ...init.headers },
        },
        fetcher,
        conflictStatuses,
    )

const assertOwnedBuild = (config: SiteBuildConfig, build: RawBuild) => {
    if (build.trigger?.external_script_id !== config.workerTag)
        throw createError({ statusCode: 404, statusMessage: 'Site build not found' })
}

export const triggerSiteBuild = async (deployHook: string, fetcher: Fetcher = fetch) => {
    const { result } = await requestCloudflare(
        deployHook,
        deployHookResponseSchema,
        { method: 'POST' },
        fetcher,
    )
    return {
        buildId: result.build_uuid,
        status: includes(buildStatuses, result.status) ? result.status : 'unknown',
        createdAt: result.created_on ?? null,
        alreadyExists: result.already_exists ?? false,
    }
}

export const getLatestSiteBuild = async (config: SiteBuildConfig, fetcher: Fetcher = fetch) => {
    const { result } = await apiRequest(
        config,
        `/builds/workers/${encodeURIComponent(config.workerTag)}/builds?page=1&per_page=1`,
        buildListResponseSchema,
        {},
        fetcher,
    )
    return result[0] ? normalizeSiteBuild(result[0]) : null
}

export const getSiteBuild = async (
    config: SiteBuildConfig,
    buildId: string,
    fetcher: Fetcher = fetch,
) => {
    const { result } = await apiRequest(
        config,
        `/builds/builds/${encodeURIComponent(buildId)}`,
        buildResponseSchema,
        {},
        fetcher,
    )
    assertOwnedBuild(config, result)
    return normalizeSiteBuild(result)
}

export const cancelSiteBuild = async (
    config: SiteBuildConfig,
    buildId: string,
    fetcher: Fetcher = fetch,
) => {
    const build = await getSiteBuild(config, buildId, fetcher)
    if (!build.canCancel)
        throw createError({ statusCode: 409, statusMessage: 'The site build has already stopped' })

    await apiRequest(
        config,
        `/builds/builds/${encodeURIComponent(buildId)}/cancel`,
        cancelResponseSchema,
        { method: 'PUT' },
        fetcher,
        [400, 404, 409],
    )
    return { canceled: true }
}
