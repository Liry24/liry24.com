import z from 'zod'

const request = {
    params: z.object({
        slug: z.string(),
    }),
}

export default eventHandler(async () => {
    const { slug } = await validateParams(request.params)

    const data = await db.query.posts.findFirst({
        where: {
            slug: { eq: slug },
            status: { eq: 'published' },
            publishedAt: { lte: new Date() },
        },
        with: {
            tags: {
                columns: {
                    tag: true,
                },
            },
        },
    })

    if (!data)
        throw createError({
            status: 404,
            statusText: 'Post not found',
        })

    return data
})
