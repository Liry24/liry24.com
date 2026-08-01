import { describe, expect, test } from 'bun:test'

import {
    withOAuthIssuerCompatibility,
    withoutOAuthResponseIssuer,
} from '../server/utils/oauthMetadata'

describe('OAuth authorization server metadata compatibility', () => {
    test('removes only the optional response issuer from a callback URL', () => {
        expect(
            withoutOAuthResponseIssuer(
                new URL(
                    'https://chatgpt.com/connector/oauth/test?code=code-1&state=state-1&iss=https%3A%2F%2Fliry24.test%2Fapi%2Fauth',
                ),
            ).toString(),
        ).toBe('https://chatgpt.com/connector/oauth/test?code=code-1&state=state-1')
    })

    test.each([
        'https://liry24.test/.well-known/oauth-authorization-server',
        'https://liry24.test/api/auth/.well-known/oauth-authorization-server',
        'https://liry24.test/.well-known/oauth-authorization-server/api/auth',
    ])('makes the RFC 9207 response issuer extension optional at %s', async (url) => {
        const response = await withOAuthIssuerCompatibility(
            Response.json({
                issuer: 'https://liry24.test/api/auth',
                authorization_response_iss_parameter_supported: true,
            }),
            new Request(url),
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            issuer: 'https://liry24.test/api/auth',
            authorization_response_iss_parameter_supported: false,
        })
    })

    test('does not change unrelated JSON responses', async () => {
        const response = Response.json({ authorization_response_iss_parameter_supported: true })
        const unchanged = await withOAuthIssuerCompatibility(
            response,
            new Request('https://liry24.test/api/auth/get-session'),
        )

        expect(unchanged).toBe(response)
    })
})
