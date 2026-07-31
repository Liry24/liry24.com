import { getAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
    const auth = await getAuth()
    return await auth.handler(toWebRequest(event))
})
