import { afterEach, describe, expect, mock, test } from 'bun:test'

import { Client, StreamableHTTPClientTransport, type FetchLike } from '@modelcontextprotocol/client'
import type { AuthInfo } from '@modelcontextprotocol/server'

await mock.module('nitropack/runtime', () => ({
    useEvent: () => {
        throw new Error('A request-scoped Nitro event was not expected in the protocol test')
    },
}))

const { liry24McpHandler } = await import('../server/utils/mcp')

const connected: Client[] = []

afterEach(async () => {
    await Promise.all(connected.splice(0).map((client) => client.close()))
})

const authInfo: AuthInfo = {
    token: 'test-token',
    clientId: 'test-client',
    scopes: ['liry24:admin'],
    expiresAt: Math.floor(Date.now() / 1_000) + 60,
    resource: new URL('https://liry24.test/mcp'),
    extra: {
        userId: 'test-admin',
        headers: new Headers({ authorization: 'Bearer test-token' }),
        database: {},
        r2: {},
        imageBaseUrl: 'https://images.liry24.test',
        auth: {},
    },
}

const localFetch: FetchLike = async (input, init) => {
    const request = input instanceof Request && !init ? input : new Request(input, init)
    return liry24McpHandler.fetch(request, { authInfo })
}

const connect = async (mode: 'legacy' | 'auto') => {
    const client = new Client(
        { name: `liry24-${mode}-test`, version: '1.0.0' },
        { versionNegotiation: { mode } },
    )
    const transport = new StreamableHTTPClientTransport(new URL('https://liry24.test/mcp'), {
        fetch: localFetch,
    })
    await client.connect(transport)
    connected.push(client)
    return client
}

describe('MCP protocol compatibility', () => {
    test('serves the 2026-07-28 negotiated transport', async () => {
        const client = await connect('auto')
        const { tools } = await client.listTools()
        expect(tools.map((tool) => tool.name)).toEqual([
            'liry24_admin_query',
            'liry24_admin_prepare',
            'liry24_admin_apply',
            'liry24_admin_issue_upload_url',
        ])
    })

    test('falls back to the legacy stateless transport', async () => {
        const client = await connect('legacy')
        const { tools } = await client.listTools()
        expect(tools).toHaveLength(4)
    })
})
