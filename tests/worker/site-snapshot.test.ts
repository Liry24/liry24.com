import { createDB, schema } from '@repo/database'
import { applyD1Migrations, reset } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { beforeEach, expect, test } from 'vitest'

import { getPublicSiteSnapshot } from '../../apps/admin/server/utils/siteSnapshot'

const database = createDB(env.DB)

beforeEach(async () => {
    await reset()
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})

test('public snapshot exposes only publishable content in display order', async () => {
    const now = new Date('2026-08-08T12:00:00.000Z')
    const earlier = new Date('2026-08-01T00:00:00.000Z')
    const later = new Date('2026-08-02T00:00:00.000Z')

    await database.batch([
        database.insert(schema.arts).values([
            { slug: 'art-second', title: 'Second art', sortIndex: 1, createdAt: earlier },
            { slug: 'art-first', title: 'First art', sortIndex: 0, createdAt: later },
        ]),
        database.insert(schema.artImages).values([
            { artSlug: 'art-first', src: '/first.webp', alt: 'First' },
            { artSlug: 'art-second', src: '/second.webp', alt: 'Second' },
        ]),
        database.insert(schema.careers).values([
            { period: 'second', position: 'B', company: 'B', sortIndex: 1 },
            { period: 'first', position: 'A', company: 'A', sortIndex: 0 },
        ]),
        database.insert(schema.posts).values([
            {
                slug: 'published-old',
                title: 'Published old',
                excerpt: '',
                content: 'old',
                status: 'published',
                publishedAt: new Date('2026-08-05T00:00:00.000Z'),
            },
            {
                slug: 'published-new',
                title: 'Published new',
                excerpt: '',
                content: 'new',
                status: 'published',
                publishedAt: new Date('2026-08-07T00:00:00.000Z'),
            },
            {
                slug: 'future',
                title: 'Future',
                excerpt: '',
                content: 'future',
                status: 'published',
                publishedAt: new Date('2026-08-09T00:00:00.000Z'),
            },
            {
                slug: 'draft',
                title: 'Draft',
                excerpt: '',
                content: 'draft',
                status: 'draft',
                publishedAt: new Date('2026-08-06T00:00:00.000Z'),
            },
        ]),
        database.insert(schema.postTags).values([
            { postSlug: 'published-new', tag: 'release' },
            { postSlug: 'draft', tag: 'private' },
        ]),
        database.insert(schema.ranks).values([
            { game: 'second', rank: 'B', imageUrl: '/b.webp', sortIndex: 1 },
            { game: 'first', rank: 'A', imageUrl: '/a.webp', sortIndex: 0 },
        ]),
        database.insert(schema.skills).values([
            { name: 'second', icon: 'b', sortIndex: 1 },
            { name: 'first', icon: 'a', sortIndex: 0 },
        ]),
        database.insert(schema.socials).values([
            { href: 'https://b.example', icon: 'b', label: 'second', sortIndex: 1 },
            { href: 'https://a.example', icon: 'a', label: 'first', sortIndex: 0 },
        ]),
        database.insert(schema.works).values([
            { slug: 'work-second', title: 'Second work', sortIndex: 1, createdAt: earlier },
            { slug: 'work-first', title: 'First work', sortIndex: 0, createdAt: later },
        ]),
    ])

    const snapshot = await getPublicSiteSnapshot(database, now)

    expect(snapshot.arts.map(({ slug }) => slug)).toEqual(['art-first', 'art-second'])
    expect(snapshot.arts[0]?.images).toEqual([{ src: '/first.webp', alt: 'First' }])
    expect(snapshot.careers.map(({ period }) => period)).toEqual(['first', 'second'])
    expect(snapshot.posts.map(({ slug }) => slug)).toEqual(['published-new', 'published-old'])
    expect(snapshot.posts[0]?.tags).toEqual([{ tag: 'release' }])
    expect(snapshot.ranks.map(({ game }) => game)).toEqual(['first', 'second'])
    expect(snapshot.skills.map(({ name }) => name)).toEqual(['first', 'second'])
    expect(snapshot.socials.map(({ label }) => label)).toEqual(['first', 'second'])
    expect(snapshot.works.map(({ slug }) => slug)).toEqual(['work-first', 'work-second'])
})
