import z from 'zod'

const request = {
    query: z.object({
        limit: z.union([z.number(), z.string().transform(Number)]).default(10),
        offset: z.union([z.number(), z.string().transform(Number)]).default(0),
    }),
}

export default eventHandler(async () => {
    const { limit, offset } = await validateQuery(request.query)

    const data = await db.query.posts.findMany({
        columns: {
            slug: true,
            createdAt: true,
            updatedAt: true,
            title: true,
        },
        with: {
            tags: {
                columns: {
                    tag: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        limit,
        offset,
    })

    await defineCDNCache(60 * 60 * 24, 'posts')

    return data
})
