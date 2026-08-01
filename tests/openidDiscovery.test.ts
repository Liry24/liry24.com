import { describe, expect, test } from 'bun:test'

import { openIdDiscoveryNotSupported } from '../server/utils/openidDiscovery'

describe('OpenID discovery fallback', () => {
    test('returns a stable JSON 404 instead of rendering the Nuxt error page', async () => {
        const response = openIdDiscoveryNotSupported()

        expect(response.status).toBe(404)
        expect(response.headers.get('content-type')).toContain('application/json')
        expect(await response.json()).toEqual({
            error: 'not_found',
            error_description:
                'OpenID Connect discovery is not enabled; use OAuth authorization server metadata.',
        })
    })
})
