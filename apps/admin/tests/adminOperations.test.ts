import { describe, expect, test } from 'bun:test'

import { adminOperationSchema, adminPrepareInputSchema } from '../server/utils/adminOperations'
import {
    assertSafeImportUrl,
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

    test('keeps the documented import limit at 10 MiB', () => {
        expect(MAX_ADMIN_UPLOAD_BYTES).toBe(10 * 1024 * 1024)
    })
})
