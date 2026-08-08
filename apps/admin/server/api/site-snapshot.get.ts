import type { PublicSiteSnapshot } from '@repo/database/types'

const encode = new TextEncoder()

const hasMatchingApiKey = async (provided: string, expected: string) => {
    const [providedHash, expectedHash] = await Promise.all([
        crypto.subtle.digest('SHA-256', encode.encode(provided)),
        crypto.subtle.digest('SHA-256', encode.encode(expected)),
    ])

    return (
        crypto.subtle as SubtleCrypto & {
            timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean
        }
    ).timingSafeEqual(providedHash, expectedHash)
}

export default defineEventHandler(async (event) => {
    const authorization = getHeader(event, 'authorization')
    const providedApiKey = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
    const expectedApiKey =
        getCloudflareEnvironment<{ ADMIN_API_KEY?: string }>(event).ADMIN_API_KEY ??
        process.env.ADMIN_API_KEY

    if (!expectedApiKey || !(await hasMatchingApiKey(providedApiKey, expectedApiKey)))
        throw serverError.forbidden()

    const db = useDB()
    const now = new Date()
    const [arts, careers, posts, ranks, skills, socials, works] = await Promise.all([
        db.query.arts.findMany({
            columns: { slug: true, title: true, description: true, href: true },
            orderBy: { sortIndex: 'asc', createdAt: 'asc' },
            with: { images: { columns: { src: true, alt: true } } },
        }),
        db.query.careers.findMany({
            columns: { period: true, position: true, company: true },
            orderBy: { sortIndex: 'asc' },
        }),
        db.query.posts.findMany({
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
        db.query.ranks.findMany({
            columns: { game: true, season: true, rank: true, imageUrl: true, href: true },
            orderBy: { sortIndex: 'asc' },
        }),
        db.query.skills.findMany({
            columns: { name: true, icon: true, category: true },
            orderBy: { sortIndex: 'asc' },
        }),
        db.query.socials.findMany({
            columns: { href: true, icon: true, label: true },
            orderBy: { sortIndex: 'asc' },
        }),
        db.query.works.findMany({
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

    return { arts, careers, posts, ranks, skills, socials, works } satisfies PublicSiteSnapshot
})
