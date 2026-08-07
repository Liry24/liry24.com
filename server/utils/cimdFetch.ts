import type { ClientMetadataResourceFetch } from '@better-auth/oauth-provider'

const forwardedRequestHeaders = new Set(['accept', 'if-none-match', 'if-modified-since'])

export type CimdMetadataFetcher = {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}

type CimdMetadataFetchRequest = {
    url: string
    method: 'GET' | 'HEAD'
    headers: Record<string, string>
}

/**
 * Adapts the internal Worker service binding to Better Auth's CIMD transport.
 * The bound Container owns DNS resolution and the outbound HTTPS connection;
 * this Worker only relays the request and its response without following redirects.
 */
export const createCimdMetadataResourceFetch =
    (service?: CimdMetadataFetcher): ClientMetadataResourceFetch =>
    async (input, init) => {
        const metadataFetcher = service
        if (!metadataFetcher) throw new Error('The CIMD metadata fetcher service is not configured')

        const metadataRequest = new Request(input, init)
        if (metadataRequest.method !== 'GET' && metadataRequest.method !== 'HEAD')
            throw new TypeError('CIMD metadata requests must use GET or HEAD')

        const headers = Object.fromEntries(
            [...metadataRequest.headers].filter(([name]) => forwardedRequestHeaders.has(name)),
        )
        const body: CimdMetadataFetchRequest = {
            url: metadataRequest.url,
            method: metadataRequest.method,
            headers,
        }
        const response = await metadataFetcher.fetch('https://cimd-fetcher.internal/metadata', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
            signal: metadataRequest.signal,
        })

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        })
    }
