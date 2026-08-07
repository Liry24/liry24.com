import { describe, expect, test } from 'bun:test'

import { fetchClientMetadataResource } from '@better-auth/cimd/node'

import {
    createCimdMetadataResourceFetch,
    type CimdMetadataFetcher,
} from '../server/utils/cimdFetch'

describe('CIMD metadata service binding adapter', () => {
    test('relays only metadata-safe request headers and preserves the response', async () => {
        let request: Request | undefined
        const service: CimdMetadataFetcher = {
            fetch: async (input, init) => {
                request = new Request(input, init)
                return new Response('{"client_id":"https://client.example/metadata"}', {
                    status: 200,
                    headers: {
                        'cache-control': 'max-age=60',
                        'content-type': 'application/json',
                        etag: '"metadata-v1"',
                    },
                })
            },
        }
        const fetchMetadata = createCimdMetadataResourceFetch(service)

        const response = await fetchMetadata('https://client.example/metadata', {
            headers: {
                accept: 'application/json',
                authorization: 'Bearer must-not-be-forwarded',
                'if-none-match': '"metadata-v0"',
            },
        })

        expect(request?.url).toBe('https://cimd-fetcher.internal/metadata')
        expect(request?.method).toBe('POST')
        expect(await request?.json()).toEqual({
            url: 'https://client.example/metadata',
            method: 'GET',
            headers: {
                accept: 'application/json',
                'if-none-match': '"metadata-v0"',
            },
        })
        expect(response.status).toBe(200)
        expect(response.headers.get('etag')).toBe('"metadata-v1"')
        expect(await response.json()).toEqual({ client_id: 'https://client.example/metadata' })
    })

    test('fails closed when the internal fetcher binding is unavailable', async () => {
        const fetchMetadata = createCimdMetadataResourceFetch()
        let failure: unknown
        try {
            await fetchMetadata('https://client.example/metadata')
        } catch (error) {
            failure = error
        }
        expect(failure).toBeInstanceOf(Error)
        expect((failure as Error).message).toBe(
            'The CIMD metadata fetcher service is not configured',
        )
    })

    test('uses Better Auth’s node transport to reject private metadata hosts', async () => {
        let failure: unknown
        try {
            await fetchClientMetadataResource('https://127.0.0.1/metadata')
        } catch (error) {
            failure = error
        }
        expect(failure).toBeInstanceOf(Error)
        expect((failure as Error).message).toContain(
            'metadata hostname must resolve only to public-routable addresses',
        )
    })
})
