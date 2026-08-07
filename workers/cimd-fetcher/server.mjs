import { createServer } from 'node:http'
import { Readable } from 'node:stream'

import { fetchClientMetadataResource } from '@better-auth/cimd/node'

const MAX_REQUEST_BODY_BYTES = 16 * 1024
const forwardedRequestHeaders = new Set(['accept', 'if-none-match', 'if-modified-since'])
const hopByHopResponseHeaders = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
])

const sendError = (response, status, message) => {
    response.statusCode = status
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ error: message }))
}

const readJsonBody = (request) =>
    new Promise((resolve, reject) => {
        const chunks = []
        let size = 0
        request.on('data', (chunk) => {
            size += chunk.length
            if (size > MAX_REQUEST_BODY_BYTES) {
                reject(new RangeError('request body is too large'))
                request.destroy()
                return
            }
            chunks.push(chunk)
        })
        request.once('error', reject)
        request.once('end', () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
            } catch {
                reject(new SyntaxError('request body must be JSON'))
            }
        })
    })

const normalizeHeaders = (headers) => {
    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return {}
    return Object.fromEntries(
        Object.entries(headers).filter(
            ([name, value]) =>
                forwardedRequestHeaders.has(name.toLowerCase()) && typeof value === 'string',
        ),
    )
}

const forwardResponse = (upstream, response) => {
    response.statusCode = upstream.status
    if (upstream.statusText) response.statusMessage = upstream.statusText
    for (const [name, value] of upstream.headers) {
        if (!hopByHopResponseHeaders.has(name.toLowerCase())) response.setHeader(name, value)
    }
    if (!upstream.body) {
        response.end()
        return
    }
    Readable.fromWeb(upstream.body)
        .once('error', () => response.destroy())
        .pipe(response)
}

const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost')
    if (request.method !== 'POST' || requestUrl.pathname !== '/metadata') {
        sendError(response, 404, 'not found')
        return
    }

    try {
        const body = await readJsonBody(request)
        if (
            !body ||
            typeof body.url !== 'string' ||
            (body.method !== 'GET' && body.method !== 'HEAD')
        ) {
            sendError(response, 400, 'invalid metadata request')
            return
        }

        const controller = new AbortController()
        request.once('aborted', () => controller.abort())
        const upstream = await fetchClientMetadataResource(body.url, {
            method: body.method,
            headers: normalizeHeaders(body.headers),
            redirect: 'error',
            signal: controller.signal,
        })
        forwardResponse(upstream, response)
    } catch (error) {
        console.error(
            JSON.stringify({
                event: 'cimd_metadata_fetch_failed',
                message: error instanceof Error ? error.message : 'unknown error',
            }),
        )
        if (!response.headersSent) sendError(response, 502, 'metadata fetch failed')
        else response.destroy()
    }
})

server.listen(Number(process.env.PORT ?? 8080), '0.0.0.0')
