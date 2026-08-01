import { getAuth } from '../../utils/auth'
import { withOAuthIssuerCompatibility } from '../../utils/oauthMetadata'

export default eventHandler(async (event) => {
    const request = toWebRequest(event)
    const metadataUrl = new URL(request.url)
    metadataUrl.pathname = '/api/auth/.well-known/oauth-authorization-server'

    const auth = await getAuth()
    const response = await auth.handler(new Request(metadataUrl, request))
    return await withOAuthIssuerCompatibility(response, request)
})
