import { describe, expect, mock, test } from 'bun:test'

import {
    cancelSiteBuild,
    getLatestSiteBuild,
    triggerSiteBuild,
    type SiteBuildConfig,
} from '../server/utils/siteBuild'

const config: SiteBuildConfig = {
    accountId: 'account-id',
    apiToken: 'api-token',
    workerTag: 'worker-tag',
}

const jsonResponse = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: { 'content-type': 'application/json' } })

describe('site build integration', () => {
    test('returns the build UUID supplied by the deploy hook', async () => {
        const fetcher = mock(async () =>
            jsonResponse({
                success: true,
                result: {
                    build_uuid: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
                    status: 'queued',
                    created_on: '2026-08-10T00:00:00Z',
                    already_exists: true,
                },
            }),
        ) as unknown as typeof fetch

        await expect(triggerSiteBuild('https://deploy-hook.test', fetcher)).resolves.toEqual({
            buildId: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
            status: 'queued',
            createdAt: '2026-08-10T00:00:00Z',
            alreadyExists: true,
        })
    })

    test('rejects a deploy hook response without a build UUID', async () => {
        const fetcher = (async () =>
            jsonResponse({ success: true, result: { status: 'queued' } })) as typeof fetch

        await expect(triggerSiteBuild('https://deploy-hook.test', fetcher)).rejects.toMatchObject({
            statusCode: 502,
        })
    })

    test('reads and normalizes the latest build for the configured worker', async () => {
        let request: Request | undefined
        const fetcher = (async (input, init) => {
            request = new Request(input, init)
            return jsonResponse({
                success: true,
                result: [
                    {
                        build_uuid: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
                        status: 'running',
                        build_outcome: null,
                        created_on: '2026-08-10T00:00:00Z',
                        build_trigger_metadata: {
                            branch: 'main',
                            build_trigger_source: 'deploy_hook',
                        },
                        trigger: { external_script_id: 'worker-tag' },
                    },
                ],
            })
        }) as typeof fetch

        await expect(getLatestSiteBuild(config, fetcher)).resolves.toMatchObject({
            id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
            status: 'running',
            outcome: null,
            trigger: 'deploy_hook',
            branch: 'main',
            canCancel: true,
        })
        expect(request?.url).toContain('/builds/workers/worker-tag/builds?page=1&per_page=1')
        expect(request?.headers.get('authorization')).toBe('Bearer api-token')
    })

    test('cancels only an active build owned by the configured worker', async () => {
        const requests: Request[] = []
        const fetcher = (async (input, init) => {
            const request = new Request(input, init)
            requests.push(request)
            if (requests.length === 1)
                return jsonResponse({
                    success: true,
                    result: {
                        build_uuid: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
                        status: 'running',
                        trigger: { external_script_id: 'worker-tag' },
                    },
                })
            return jsonResponse({
                success: true,
                result: { build_uuid: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e' },
            })
        }) as typeof fetch

        await expect(
            cancelSiteBuild(config, '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e', fetcher),
        ).resolves.toEqual({ canceled: true })
        expect(requests).toHaveLength(2)
        expect(requests[1]?.method).toBe('PUT')
        expect(requests[1]?.url).toEndWith(
            '/builds/builds/182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e/cancel',
        )
    })

    test('rejects builds owned by another worker', async () => {
        const fetcher = (async () =>
            jsonResponse({
                success: true,
                result: {
                    build_uuid: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
                    status: 'running',
                    trigger: { external_script_id: 'another-worker' },
                },
            })) as typeof fetch

        await expect(
            cancelSiteBuild(config, '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e', fetcher),
        ).rejects.toMatchObject({ statusCode: 404 })
    })
})
