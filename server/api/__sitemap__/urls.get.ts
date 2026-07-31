export default defineSitemapEventHandler(async () => {
    const permanent = [
        {
            loc: '/',
            images: [{ loc: '/ogp.png' }],
        },
        { loc: '/arts' },
        { loc: '/posts' },
    ]

    const posts = await db.query.posts.findMany({
        columns: {
            updatedAt: true,
            title: true,
            slug: true,
        },
        where: {
            status: { eq: 'published' },
            publishedAt: { lte: new Date() },
        },
    })

    return [
        ...permanent,
        ...posts.map((post) => ({
            loc: `/posts/${post.slug}`,
            lastmod: post.updatedAt,
            title: post.title,
        })),
    ]
})
