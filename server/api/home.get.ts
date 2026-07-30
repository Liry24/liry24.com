export default eventHandler(async () => {
    const [socials, arts, careers, ranks, posts, works, skills] = await db.batch([
        db.query.socials.findMany({
            orderBy: {
                sortIndex: 'asc',
            },
        }),
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
        db.query.careers.findMany({
            orderBy: {
                sortIndex: 'asc',
            },
        }),
        db.query.ranks.findMany({
            orderBy: {
                sortIndex: 'asc',
            },
        }),
        db.query.posts.findMany({
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
            limit: 10,
            offset: 0,
        }),
        db.query.works.findMany({
            orderBy: {
                sortIndex: 'asc',
                createdAt: 'asc',
            },
        }),
        db.query.skills.findMany({
            orderBy: {
                sortIndex: 'asc',
            },
        }),
    ])

    return { socials, arts, careers, ranks, posts, works, skills }
})
