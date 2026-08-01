const authorizationServerMetadataPaths = new Set([
    '/.well-known/oauth-authorization-server',
    '/api/auth/.well-known/oauth-authorization-server',
    '/.well-known/oauth-authorization-server/api/auth',
])

export const withoutOAuthResponseIssuer = (url: URL) => {
    const normalized = new URL(url)
    normalized.searchParams.delete('iss')
    return normalized
}

export const withOAuthIssuerCompatibility = async (response: Response, request: Request) => {
    if (
        request.method !== 'GET' ||
        !response.ok ||
        !authorizationServerMetadataPaths.has(new URL(request.url).pathname) ||
        !response.headers.get('content-type')?.includes('application/json')
    )
        return response

    const metadata = (await response.clone().json()) as Record<string, unknown>
    if (metadata.authorization_response_iss_parameter_supported !== true) return response

    // Some OpenAI clients currently drop the RFC 9207 `iss` value while
    // relaying the browser callback, then reject the response when discovery
    // says the value is mandatory. State, exact redirect URI, and PKCE remain
    // enforced; only the optional issuer-response extension is advertised as
    // a compatibility fallback.
    metadata.authorization_response_iss_parameter_supported = false

    const headers = new Headers(response.headers)
    headers.delete('content-length')
    headers.delete('etag')
    return new Response(JSON.stringify(metadata), {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}
