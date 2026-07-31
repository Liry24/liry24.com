import { describe, expect, test } from 'bun:test'

import { DEFAULT_LOGIN_REDIRECT, resolveLoginRedirect } from '../app/utils/resolveLoginRedirect'

describe('login redirect resolution', () => {
    test('defaults to the admin dashboard', () => {
        expect(resolveLoginRedirect(undefined)).toBe(DEFAULT_LOGIN_REDIRECT)
        expect(resolveLoginRedirect('')).toBe(DEFAULT_LOGIN_REDIRECT)
    })

    test('keeps safe same-origin paths', () => {
        expect(resolveLoginRedirect('/admin')).toBe('/admin')
        expect(resolveLoginRedirect('/oauth/consent?client_id=client-1&scope=liry24%3Aadmin')).toBe(
            '/oauth/consent?client_id=client-1&scope=liry24%3Aadmin',
        )
    })

    test('rejects absolute and protocol-relative redirects', () => {
        expect(resolveLoginRedirect('https://example.com')).toBe(DEFAULT_LOGIN_REDIRECT)
        expect(resolveLoginRedirect('//example.com')).toBe(DEFAULT_LOGIN_REDIRECT)
        expect(resolveLoginRedirect('/\\example.com')).toBe(DEFAULT_LOGIN_REDIRECT)
    })
})
