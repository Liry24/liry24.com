export default promiseEventHandler(async ({ event, db }) => {
    const headers = getRequestHeaders(event)
    if (headers['Authorization'] !== `Bearer ${process.env.ADMIN_API_KEY}`)
        throw serverError.forbidden()

    const [arts, careers, posts, ranks, skills, socials, works] = await Promise.all([
        db.query.arts.findMany({
            orderBy: {
                sortIndex: 'asc',
                createdAt: 'asc',
            },
            with: {
                images: {
                    columns: {
                        src: true,
                        alt: true,
                    },
                },
            },
        }),
        db.query.careers.findMany({ orderBy: { sortIndex: 'asc' } }),
        db.query.posts.findMany({
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
                    columns: { tag: true },
                },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    limit: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
            limit: Math.min(10),
        }),
        db.query.ranks.findMany({ orderBy: { sortIndex: 'asc' } }),
        db.query.skills.findMany({ orderBy: { sortIndex: 'asc' } }),
        db.query.socials.findMany({ orderBy: { sortIndex: 'asc' } }),
        db.query.works.findMany({ orderBy: { sortIndex: 'asc', createdAt: 'asc' } }),
    ])

    return { arts, careers, posts, ranks, skills, socials, works }
})
