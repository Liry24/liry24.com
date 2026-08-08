import { createDB, schema } from '@repo/database'
import { applyD1Migrations, reset } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { reorderRecords } from '../../apps/admin/server/utils/sortOrder'

const database = createDB(env.DB)

type ResourceCase = {
    name: string
    initialOrder: Array<number | string>
    reordered: Array<number | string>
    seed: () => Promise<void>
    read: () => Promise<Record<string, unknown>[]>
    reorder: (order: Array<number | string>) => Promise<void>
}

const createReorder =
    <T>(
        current: () => Promise<T[]>,
        update: (items: { id: T; sortIndex: number }[]) => Promise<unknown>,
    ) =>
    async (order: Array<number | string>) =>
        reorderRecords({ order: order as T[], current: await current(), update })

const resources: ResourceCase[] = [
    {
        name: 'arts',
        initialOrder: ['art-a', 'art-b'],
        reordered: ['art-b', 'art-a'],
        seed: async () => {
            await database.batch([
                database.insert(schema.arts).values([
                    { slug: 'art-a', title: 'Art A', href: 'https://a.example', sortIndex: 0 },
                    { slug: 'art-b', title: 'Art B', href: 'https://b.example', sortIndex: 1 },
                ]),
                database.insert(schema.artImages).values([
                    { artSlug: 'art-a', src: '/a.webp', alt: 'A' },
                    { artSlug: 'art-b', src: '/b.webp', alt: 'B' },
                ]),
            ])
        },
        read: async () =>
            (await database.query.arts.findMany({
                orderBy: { sortIndex: 'asc' },
                with: { images: true },
            })) as unknown as Record<string, unknown>[],
        reorder: createReorder(
            async () =>
                (await database.select({ id: schema.arts.slug }).from(schema.arts)).map(
                    ({ id }) => id,
                ),
            async (items) => {
                const statements = items.map(({ id, sortIndex }) =>
                    database.update(schema.arts).set({ sortIndex }).where(eq(schema.arts.slug, id)),
                )
                if (statements[0]) await database.batch([statements[0], ...statements.slice(1)])
            },
        ),
    },
    {
        name: 'careers',
        initialOrder: [1, 2],
        reordered: [2, 1],
        seed: () =>
            database
                .insert(schema.careers)
                .values([
                    { period: '2025', position: 'First', company: 'A', sortIndex: 0 },
                    { period: '2026', position: 'Second', company: 'B', sortIndex: 1 },
                ])
                .then(() => undefined),
        read: async () =>
            (await database.query.careers.findMany({
                orderBy: { sortIndex: 'asc' },
            })) as unknown as Record<string, unknown>[],
        reorder: createReorder(
            async () =>
                (await database.select({ id: schema.careers.id }).from(schema.careers)).map(
                    ({ id }) => id,
                ),
            async (items) => {
                const statements = items.map(({ id, sortIndex }) =>
                    database
                        .update(schema.careers)
                        .set({ sortIndex })
                        .where(eq(schema.careers.id, id)),
                )
                if (statements[0]) await database.batch([statements[0], ...statements.slice(1)])
            },
        ),
    },
    {
        name: 'ranks',
        initialOrder: [1, 2],
        reordered: [2, 1],
        seed: () =>
            database
                .insert(schema.ranks)
                .values([
                    { game: 'Game A', rank: 'A', imageUrl: '/a.webp', sortIndex: 0 },
                    { game: 'Game B', rank: 'B', imageUrl: '/b.webp', sortIndex: 1 },
                ])
                .then(() => undefined),
        read: async () =>
            (await database.query.ranks.findMany({
                orderBy: { sortIndex: 'asc' },
            })) as unknown as Record<string, unknown>[],
        reorder: createReorder(
            async () =>
                (await database.select({ id: schema.ranks.id }).from(schema.ranks)).map(
                    ({ id }) => id,
                ),
            async (items) => {
                const statements = items.map(({ id, sortIndex }) =>
                    database.update(schema.ranks).set({ sortIndex }).where(eq(schema.ranks.id, id)),
                )
                if (statements[0]) await database.batch([statements[0], ...statements.slice(1)])
            },
        ),
    },
    {
        name: 'skills',
        initialOrder: [1, 2],
        reordered: [2, 1],
        seed: () =>
            database
                .insert(schema.skills)
                .values([
                    { name: 'TypeScript', icon: 'typescript', category: 'code', sortIndex: 0 },
                    { name: 'Vue', icon: 'vue', category: 'code', sortIndex: 1 },
                ])
                .then(() => undefined),
        read: async () =>
            (await database.query.skills.findMany({
                orderBy: { sortIndex: 'asc' },
            })) as unknown as Record<string, unknown>[],
        reorder: createReorder(
            async () =>
                (await database.select({ id: schema.skills.id }).from(schema.skills)).map(
                    ({ id }) => id,
                ),
            async (items) => {
                const statements = items.map(({ id, sortIndex }) =>
                    database
                        .update(schema.skills)
                        .set({ sortIndex })
                        .where(eq(schema.skills.id, id)),
                )
                if (statements[0]) await database.batch([statements[0], ...statements.slice(1)])
            },
        ),
    },
    {
        name: 'socials',
        initialOrder: [1, 2],
        reordered: [2, 1],
        seed: () =>
            database
                .insert(schema.socials)
                .values([
                    { href: 'https://a.example', icon: 'a', label: 'A', sortIndex: 0 },
                    { href: 'https://b.example', icon: 'b', label: 'B', sortIndex: 1 },
                ])
                .then(() => undefined),
        read: async () =>
            (await database.query.socials.findMany({
                orderBy: { sortIndex: 'asc' },
            })) as unknown as Record<string, unknown>[],
        reorder: createReorder(
            async () =>
                (await database.select({ id: schema.socials.id }).from(schema.socials)).map(
                    ({ id }) => id,
                ),
            async (items) => {
                const statements = items.map(({ id, sortIndex }) =>
                    database
                        .update(schema.socials)
                        .set({ sortIndex })
                        .where(eq(schema.socials.id, id)),
                )
                if (statements[0]) await database.batch([statements[0], ...statements.slice(1)])
            },
        ),
    },
    {
        name: 'works',
        initialOrder: ['work-a', 'work-b'],
        reordered: ['work-b', 'work-a'],
        seed: () =>
            database
                .insert(schema.works)
                .values([
                    { slug: 'work-a', title: 'Work A', category: 'A', sortIndex: 0 },
                    { slug: 'work-b', title: 'Work B', category: 'B', sortIndex: 1 },
                ])
                .then(() => undefined),
        read: async () =>
            (await database.query.works.findMany({
                orderBy: { sortIndex: 'asc' },
            })) as unknown as Record<string, unknown>[],
        reorder: createReorder(
            async () =>
                (await database.select({ id: schema.works.slug }).from(schema.works)).map(
                    ({ id }) => id,
                ),
            async (items) => {
                const statements = items.map(({ id, sortIndex }) =>
                    database
                        .update(schema.works)
                        .set({ sortIndex })
                        .where(eq(schema.works.slug, id)),
                )
                if (statements[0]) await database.batch([statements[0], ...statements.slice(1)])
            },
        ),
    },
]

const identity = (row: Record<string, unknown>) => row.slug ?? row.id
const withoutSortIndex = (row: Record<string, unknown>) => {
    const { sortIndex: _sortIndex, ...rest } = row
    return rest
}

beforeEach(async () => {
    await reset()
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})

afterEach(async () => {
    await reset()
})

describe('sortable content resources', () => {
    test.each(resources)('$name accepts an empty order only when empty', async (resource) => {
        await expect(resource.reorder([])).resolves.toBeUndefined()
        expect(await resource.read()).toEqual([])
    })

    test.each(resources)('$name reorders without replacing records', async (resource) => {
        await resource.seed()
        const before = await resource.read()

        await resource.reorder(resource.reordered)

        const after = await resource.read()
        expect(after.map(identity)).toEqual(resource.reordered)
        expect(
            Object.fromEntries(after.map((row) => [identity(row), withoutSortIndex(row)])),
        ).toEqual(Object.fromEntries(before.map((row) => [identity(row), withoutSortIndex(row)])))
    })

    test.each(resources)(
        '$name rejects incomplete or invalid orders without writes',
        async (resource) => {
            await resource.seed()
            const before = await resource.read()
            const missing = typeof resource.initialOrder[0] === 'number' ? 999_999 : 'missing'
            const invalidOrders = [
                [resource.initialOrder[0], resource.initialOrder[0]],
                [resource.initialOrder[0], missing],
                resource.initialOrder.slice(0, 1),
            ]

            for (const order of invalidOrders) {
                await expect(resource.reorder(order)).rejects.toMatchObject({ statusCode: 400 })
                expect(await resource.read()).toEqual(before)
            }
        },
    )
})
