import { describe, expect, test } from 'bun:test'

import type { H3Event } from 'h3'

const { attachCloudflareContext } = await import('../server/utils/cloudflareContext')

describe('Cloudflare module-worker request context', () => {
    test('exposes Nitro module-worker bindings at the development-compatible path', () => {
        const waitUntil = (_promise: Promise<unknown>) => undefined
        const cloudflare = {
            request: new Request('https://liry24.test/api/works'),
            env: { DB: { prepare: () => undefined } },
            context: { waitUntil },
        }
        const event = {
            context: {
                _platform: {
                    cf: { colo: 'NRT' },
                    cloudflare,
                },
            },
        } as unknown as H3Event

        attachCloudflareContext(event)

        expect(event.context.cloudflare).toBe(cloudflare)
        expect(event.context.cf).toEqual({ colo: 'NRT' })
        expect(event.context.waitUntil).toBeFunction()
    })

    test('does not overwrite the context created by the development preset', () => {
        const existing = { env: { DB: 'development-binding' } }
        const event = {
            context: {
                cloudflare: existing,
                _platform: {
                    cloudflare: {
                        request: new Request('https://liry24.test/'),
                        env: { DB: 'production-binding' },
                        context: { waitUntil: (_promise: Promise<unknown>) => undefined },
                    },
                },
            },
        } as unknown as H3Event

        attachCloudflareContext(event)

        expect(event.context.cloudflare).toBe(existing)
    })
})
