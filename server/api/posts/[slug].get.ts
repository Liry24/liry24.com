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

    await defineCDNCache(60 * 60 * 24, `post-${slug}`)

    return data
})
