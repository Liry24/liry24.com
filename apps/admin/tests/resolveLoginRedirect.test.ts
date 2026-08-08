import { describe, expect, test } from 'bun:test'

import { DEFAULT_LOGIN_REDIRECT, resolveLoginRedirect } from '../app/utils/resolveLoginRedirect'

describe('login redirect resolution', () => {
    test('keeps safe same-origin relative destinations', () => {
        expect(resolveLoginRedirect('/posts/release-notes?tab=review')).toBe(
            '/posts/release-notes?tab=review',
        )
    })

    test.each([
        undefined,
        '',
        'https://attacker.example',
        '//attacker.example',
        '/\\attacker.example',
        'not-a-path',
    ])('falls back for unsafe redirect %p', (redirect) => {
        expect(resolveLoginRedirect(redirect)).toBe(DEFAULT_LOGIN_REDIRECT)
    })
})
