import z from 'zod'

const request = {
    params: z.object({
        slug: z.string(),
    }),
}

export default adminSessionEventHandler(async () => {
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
            reviews: {
                orderBy: {
                    createdAt: 'desc',
                },
                limit: 10,
            },
            reviewJobs: {
                orderBy: {
                    createdAt: 'desc',
                },
                limit: 5,
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
