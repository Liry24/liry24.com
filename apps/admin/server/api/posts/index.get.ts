import z from 'zod'

const request = {
    query: z.object({
        limit: z.union([z.number(), z.string().transform(Number)]).default(10),
        offset: z.union([z.number(), z.string().transform(Number)]).default(0),
    }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { limit, offset } = await validateQuery(request.query)

    const data = await db.query.posts.findMany({
        columns: {
            slug: true,
            createdAt: true,
            updatedAt: true,
            title: true,
            excerpt: true,
            status: true,
            scheduledAt: true,
            publishedAt: true,
        },
        with: {
            tags: {
                columns: {
                    tag: true,
                },
            },
            reviews: {
                orderBy: {
                    createdAt: 'desc',
                },
                limit: 1,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        limit: Math.min(limit, 50),
        offset,
    })

    return data
})
