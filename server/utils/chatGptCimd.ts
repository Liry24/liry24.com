import type { ClientDiscovery, SchemaClient, Scope } from '@better-auth/oauth-provider'

const chatGptClientPath = /^\/oauth\/(oz_[A-Za-z0-9_-]+)\/client\.json$/u

export const getChatGptCimdMetadata = (clientId: string) => {
    let url: URL
    try {
        url = new URL(clientId)
    } catch {
        return null
    }

    if (
        url.protocol !== 'https:' ||
        url.hostname !== 'chatgpt.com' ||
        url.port ||
        url.search ||
        url.hash
    )
        return null

    const connectorId = chatGptClientPath.exec(url.pathname)?.[1]
    if (!connectorId) return null

    return {
        clientId: url.toString(),
        redirectUri: `https://chatgpt.com/connector/oauth/${connectorId}`,
    }
}

export const chatGptCimdClientDiscovery: ClientDiscovery = {
    id: 'chatgpt-cimd-compatibility',
    matches: (clientId) => getChatGptCimdMetadata(clientId) !== null,
    resolve: async (ctx, clientId, existing) => {
        if (existing) return existing

        const metadata = getChatGptCimdMetadata(clientId)
        if (!metadata) return null

        const now = new Date()
        const data = {
            id: crypto.randomUUID(),
            clientId: metadata.clientId,
            clientSecret: null,
            disabled: false,
            skipConsent: false,
            enableEndSession: false,
            scopes: ['liry24:admin', 'offline_access'],
            createdAt: now,
            updatedAt: now,
            name: 'ChatGPT',
            uri: 'https://chatgpt.com/',
            redirectUris: [metadata.redirectUri],
            tokenEndpointAuthMethod: 'none',
            grantTypes: ['authorization_code', 'refresh_token'],
            responseTypes: ['code'],
            public: true,
            type: 'user-agent-based',
            requirePKCE: true,
            dpopBoundAccessTokens: false,
            metadata: {
                source: 'chatgpt-cimd-compatibility',
            },
        }

        try {
            return (await ctx.context.adapter.create({
                model: 'oauthClient',
                data,
            })) as SchemaClient<Scope[]>
        } catch (error) {
            const raced = (await ctx.context.adapter.findOne({
                model: 'oauthClient',
                where: [{ field: 'clientId', value: metadata.clientId }],
            })) as SchemaClient<Scope[]> | null
            if (raced) return raced
            throw error
        }
    },
    discoveryMetadata: {
        client_id_metadata_document_supported: true,
    },
}
