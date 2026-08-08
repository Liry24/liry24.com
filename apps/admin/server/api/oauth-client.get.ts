import z from 'zod'

const request = {
    query: z.object({ clientId: z.string().min(1) }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { clientId } = await validateQuery(request.query)
    const client = await db.query.oauthClients.findFirst({
        columns: {
            clientId: true,
            name: true,
            uri: true,
            icon: true,
        },
        where: { clientId: { eq: clientId } },
    })

    if (!client) throw createError({ status: 404, statusText: 'Not Found' })

    return { client }
})
