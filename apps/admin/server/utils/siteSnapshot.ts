import type { Database } from '@repo/database'
import type { PublicSiteSnapshot } from '@repo/database/types'

export const getPublicSiteSnapshot = async (
    database: Database,
    now = new Date(),
): Promise<PublicSiteSnapshot> => {
    const [arts, careers, posts, ranks, skills, socials, works] = await Promise.all([
        database.query.arts.findMany({
            columns: { slug: true, title: true, description: true, href: true },
            orderBy: { sortIndex: 'asc', createdAt: 'asc' },
            with: { images: { columns: { src: true, alt: true } } },
        }),
        database.query.careers.findMany({
            columns: { period: true, position: true, company: true },
            orderBy: { sortIndex: 'asc' },
        }),
        database.query.posts.findMany({
            columns: {
                slug: true,
                createdAt: true,
                updatedAt: true,
                title: true,
                excerpt: true,
                content: true,
                publishedAt: true,
            },
            where: { status: { eq: 'published' }, publishedAt: { lte: now } },
            with: { tags: { columns: { tag: true } } },
            orderBy: { publishedAt: 'desc' },
        }),
        database.query.ranks.findMany({
            columns: { game: true, season: true, rank: true, imageUrl: true, href: true },
            orderBy: { sortIndex: 'asc' },
        }),
        database.query.skills.findMany({
            columns: { name: true, icon: true, category: true },
            orderBy: { sortIndex: 'asc' },
        }),
        database.query.socials.findMany({
            columns: { href: true, icon: true, label: true },
            orderBy: { sortIndex: 'asc' },
        }),
        database.query.works.findMany({
            columns: {
                slug: true,
                createdAt: true,
                title: true,
                description: true,
                category: true,
                image: true,
                icon: true,
                href: true,
                price: true,
                style: true,
            },
            orderBy: { sortIndex: 'asc', createdAt: 'asc' },
        }),
    ])

    return { arts, careers, posts, ranks, skills, socials, works }
}
