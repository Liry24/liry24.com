import { getAuth } from '../../../../utils/auth'
import { withOAuthIssuerCompatibility } from '../../../../utils/oauthMetadata'

export default eventHandler(async (event) => {
    const request = toWebRequest(event)
    const auth = await getAuth()
    return await withOAuthIssuerCompatibility(await auth.handler(request), request)
})
