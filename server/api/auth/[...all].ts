const isChatGptOrigin = (origin: string | null) => {
    if (!origin) return false

    try {
        const url = new URL(origin)
        return (
            url.protocol === 'https:' &&
            (url.hostname === 'chatgpt.com' ||
                url.hostname.endsWith('.chatgpt.com') ||
                url.hostname === 'chat.openai.com')
        )
    } catch {
        return false
    }
}

const isOAuthBrowserEndpoint = (request: Request) => {
    const pathname = new URL(request.url).pathname
    return pathname.endsWith('/oauth2/register') || pathname.endsWith('/oauth2/token')
}

const normalizeAuthorizationQueryOrder = (request: Request) => {
    if (request.method !== 'GET') return null

    const url = new URL(request.url)
    if (!url.pathname.endsWith('/oauth2/authorize')) return null

    const params = [...url.searchParams.entries()]
    if (!url.searchParams.has('resource') || !url.searchParams.has('state')) return null

    // Some browser/proxy combinations mishandle the RFC 8707 resource
    // parameter when it is immediately followed by state. Keep the same
    // values but place state before resource so the authorization request is
    // processed consistently without changing the OAuth semantics.
    const normalized = new URLSearchParams()
    for (const [key, value] of params) {
        if (key !== 'state' && key !== 'resource') normalized.append(key, value)
    }
    for (const value of url.searchParams.getAll('state')) normalized.append('state', value)
    for (const value of url.searchParams.getAll('resource')) normalized.append('resource', value)

    if (normalized.toString() === url.searchParams.toString()) return null
    url.search = normalized.toString()
    return url.toString()
}

const normalizeChatGptAuthorizationResponse = (response: Response, request: Request) => {
    if (
        request.method !== 'GET' ||
        !new URL(request.url).pathname.endsWith('/oauth2/authorize') ||
        response.status < 300 ||
        response.status >= 400
    )
        return response

    const location = response.headers.get('location')
    if (!location) return response

    const redirectURL = new URL(location, request.url)
    const isSameOrigin = redirectURL.origin === new URL(request.url).origin
    const isChatGptCallback =
        isChatGptOrigin(redirectURL.origin) && redirectURL.pathname.startsWith('/connector/oauth/')
    if (!isSameOrigin && !isChatGptCallback) return response

    // ChatGPT's callback relay currently rejects the optional RFC 9207
    // issuer parameter before it reaches the token endpoint. Discovery
    // advertises this extension as optional, so omit it only for ChatGPT;
    // state, exact redirect URI, and PKCE remain enforced by Better Auth.
    const compatibleRedirectURL = isChatGptCallback
        ? withoutOAuthResponseIssuer(redirectURL)
        : redirectURL

    // Some connector webviews do not follow a relative Location returned by
    // the OAuth login redirect. Make same-origin redirects absolute while
    // preserving the original query and status.
    const absoluteLocation = compatibleRedirectURL.toString()
    if (location === absoluteLocation) return response

    const headers = new Headers(response.headers)
    headers.set('location', absoluteLocation)
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

const withOAuthCors = (response: Response, request: Request) => {
    if (!isOAuthBrowserEndpoint(request) || !isChatGptOrigin(request.headers.get('origin')))
        return response

    const origin = request.headers.get('origin')!
    const headers = new Headers(response.headers)
    headers.set('access-control-allow-origin', origin)
    headers.set('access-control-allow-methods', 'GET, POST, OPTIONS')
    headers.set('access-control-allow-headers', 'content-type, authorization')
    headers.set('access-control-max-age', '600')
    headers.append('vary', 'Origin')
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

export default eventHandler(async (event) => {
    const request = toWebRequest(event)

    const normalizedAuthorizationURL = normalizeAuthorizationQueryOrder(request)
    const authRequest = normalizedAuthorizationURL
        ? new Request(normalizedAuthorizationURL, request)
        : request

    if (
        request.method === 'OPTIONS' &&
        isOAuthBrowserEndpoint(request) &&
        isChatGptOrigin(request.headers.get('origin'))
    ) {
        return withOAuthCors(new Response(null, { status: 204 }), request)
    }

    try {
        const auth = await getAuth()
        const response = await withOAuthIssuerCompatibility(
            normalizeChatGptAuthorizationResponse(await auth.handler(authRequest), request),
            request,
        )
        return withOAuthCors(response, request)
    } catch (error) {
        console.error('Better Auth request failed', {
            path: new URL(request.url).pathname,
            error:
                error instanceof Error
                    ? {
                          name: error.name,
                          message: error.message,
                      }
                    : String(error),
        })
        throw error
    }
})
