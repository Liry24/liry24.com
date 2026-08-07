import z from 'zod'

const request = {
    query: z.object({
        clientId: z.string().min(1),
    }),
}

export default adminSessionEventHandler(async ({ event }) => {
    const { clientId } = await validateQuery(request.query)
    const auth = await getAuth()
    const client = await auth.api.getOAuthClientPublic({
        headers: event.headers,
        query: {
            client_id: clientId,
        },
    })
    return {
        client: {
            clientId: client.client_id,
            name: client.client_name,
            uri: client.client_uri,
            icon: client.logo_uri,
        },
    }
})
