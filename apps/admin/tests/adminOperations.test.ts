import { describe, expect, test } from 'bun:test'

import { adminOperationSchema, adminPrepareInputSchema } from '../server/utils/adminOperations'
import {
    assertSafeImportUrl,
    adminUploadRequestSchema,
    fetchSafeImage,
    MAX_ADMIN_UPLOAD_BYTES,
    normalizeAdminUploadKey,
} from '../server/utils/adminUpload'

describe('admin operation contract', () => {
    test('accepts typed post and user operations', () => {
        expect(
            adminOperationSchema.parse({
                action: 'schedule_post',
                resource: 'posts',
                id: 'release-notes',
                scheduledAt: '2026-08-01T00:00:00.000Z',
            }),
        ).toMatchObject({ action: 'schedule_post', id: 'release-notes' })
        expect(
            adminOperationSchema.parse({
                action: 'set_user_role',
                resource: 'users',
                id: 'user_1',
                role: 'admin',
            }),
        ).toMatchObject({ action: 'set_user_role', role: 'admin' })
    })

    test('caps a prepared plan at 50 operations', () => {
        const operation = {
            action: 'delete' as const,
            resource: 'skills' as const,
            id: 1,
        }
        expect(
            adminPrepareInputSchema.safeParse({
                operations: Array.from({ length: 51 }, () => operation),
            }).success,
        ).toBe(false)
    })
})

describe('admin upload safety', () => {
    test('normalizes safe keys and rejects traversal', () => {
        expect(normalizeAdminUploadKey('posts/cover-1.webp')).toBe('posts/cover-1.webp')
        expect(() => normalizeAdminUploadKey('../secret')).toThrow()
        expect(() => normalizeAdminUploadKey('/absolute.png')).toThrow()
        expect(() => normalizeAdminUploadKey('posts/.hidden.png')).toThrow()
    })

    test('rejects non-HTTPS and literal private hosts', () => {
        expect(assertSafeImportUrl('https://example.com/image.png').hostname).toBe('example.com')
        expect(() => assertSafeImportUrl('http://example.com/image.png')).toThrow()
        expect(() => assertSafeImportUrl('https://127.0.0.1/image.png')).toThrow()
        expect(() => assertSafeImportUrl('https://169.254.169.254/latest/meta-data')).toThrow()
        expect(() => assertSafeImportUrl('https://[::1]/image.png')).toThrow()
    })

    test('accepts an upload at the limit and rejects one byte more', () => {
        expect(
            adminUploadRequestSchema.safeParse({
                key: 'posts/cover.webp',
                contentType: 'image/webp',
                size: MAX_ADMIN_UPLOAD_BYTES,
            }).success,
        ).toBe(true)
        expect(
            adminUploadRequestSchema.safeParse({
                key: 'posts/cover.webp',
                contentType: 'image/webp',
                size: MAX_ADMIN_UPLOAD_BYTES + 1,
            }).success,
        ).toBe(false)
    })

    test('rejects a private redirect before fetching it', async () => {
        const originalFetch = globalThis.fetch
        globalThis.fetch = async () =>
            new Response(null, {
                status: 302,
                headers: { location: 'https://127.0.0.1/private-image.png' },
            })

        try {
            await expect(fetchSafeImage('https://images.example/cover.png')).rejects.toThrow(
                'Import URL host is not allowed',
            )
        } finally {
            globalThis.fetch = originalFetch
        }
    })

    test('rejects unsupported MIME types', async () => {
        const originalFetch = globalThis.fetch
        globalThis.fetch = async () =>
            new Response('<svg />', {
                status: 200,
                headers: { 'content-type': 'image/svg+xml' },
            })

        try {
            await expect(fetchSafeImage('https://images.example/cover.svg')).rejects.toThrow(
                'Import response is not an allowed raster image',
            )
        } finally {
            globalThis.fetch = originalFetch
        }
    })

    test('rejects a response that exceeds the limit while streaming', async () => {
        const originalFetch = globalThis.fetch
        globalThis.fetch = async () =>
            new Response(
                new ReadableStream({
                    start(controller) {
                        controller.enqueue(new Uint8Array(MAX_ADMIN_UPLOAD_BYTES))
                        controller.enqueue(new Uint8Array(1))
                        controller.close()
                    },
                }),
                { status: 200, headers: { 'content-type': 'image/png' } },
            )

        try {
            const image = await fetchSafeImage('https://images.example/cover.png')
            await expect(new Response(image.body).arrayBuffer()).rejects.toThrow(
                'Import response exceeds 10 MiB',
            )
        } finally {
            globalThis.fetch = originalFetch
        }
    })
})
