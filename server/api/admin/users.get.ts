import { getAuth } from '../../utils/authRuntime'

export default adminSessionEventHandler(async () => {
    const { headers } = useEvent()
    const auth = await getAuth()

    const data = await auth.api.listUsers({
        query: {
            limit: 4,
        },
        headers,
    })

    return data
})
