import { createDB, schema } from '@repo/database'
import { applyD1Migrations, reset } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, test } from 'vitest'

import {
    createPost,
    publishPost,
    type PostPublishWorkflow,
    updateUnpublishedPost,
} from '../../apps/admin/server/utils/postService'

const database = createDB(env.DB)

beforeEach(async () => {
    await reset()
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
    await database.insert(schema.users).values({
        id: 'author',
        name: 'Author',
        email: 'author@example.com',
    })
})

describe('post lifecycle', () => {
    test('normalizes collisions and tags when creating a draft', async () => {
        await database.insert(schema.posts).values({
            slug: 'release-notes',
            title: 'Existing',
            content: 'existing',
            authorUserId: 'author',
        })

        const slug = await createPost(database, 'author', {
            slug: ' Release Notes ',
            title: 'Release notes',
            content: 'content',
            tags: ['news', ' news ', '', 'release'],
        })

        expect(slug).toBe('release-notes-2')
        expect(
            await database.query.postTags.findMany({
                columns: { tag: true },
                where: { postSlug: { eq: slug } },
                orderBy: { tag: 'asc' },
            }),
        ).toEqual([{ tag: 'news' }, { tag: 'release' }])
    })

    test('rejects an elapsed schedule without writing a post', async () => {
        await expect(
            createPost(database, 'author', {
                title: 'Too late',
                content: 'content',
                status: 'scheduled',
                scheduledAt: new Date('2020-01-01T00:00:00.000Z'),
            }),
        ).rejects.toThrow('scheduledAt must be a future date')

        expect(await database.query.posts.findMany()).toEqual([])
    })

    test('replaces and terminates schedules before publishing', async () => {
        const created: string[] = []
        const terminated: string[] = []
        const workflow = {
            create: async ({ id }: { id: string }) => {
                created.push(id)
                return { id }
            },
            get: async (id: string) => ({
                terminate: async () => {
                    terminated.push(id)
                },
            }),
        } as unknown as PostPublishWorkflow
        const automation = { publishWorkflow: workflow }

        const slug = await createPost(
            database,
            'author',
            {
                slug: 'scheduled-post',
                title: 'Scheduled',
                content: 'content',
                status: 'scheduled',
                scheduledAt: new Date('2099-01-01T00:00:00.000Z'),
            },
            automation,
        )
        const firstInstance = created[0]!

        await updateUnpublishedPost(
            database,
            slug,
            { scheduledAt: new Date('2099-02-01T00:00:00.000Z') },
            automation,
        )
        const secondInstance = created[1]!
        expect(terminated).toEqual([firstInstance])

        const publishedAt = new Date('2026-08-08T12:00:00.000Z')
        await publishPost(database, slug, automation, publishedAt)

        expect(terminated).toEqual([firstInstance, secondInstance])
        expect(
            await database.query.posts.findFirst({
                columns: {
                    status: true,
                    publishedAt: true,
                    scheduledAt: true,
                    scheduleRevision: true,
                    publishWorkflowInstanceId: true,
                    publishWorkflowEngine: true,
                },
                where: { slug: { eq: slug } },
            }),
        ).toEqual({
            status: 'published',
            publishedAt,
            scheduledAt: null,
            scheduleRevision: null,
            publishWorkflowInstanceId: null,
            publishWorkflowEngine: null,
        })
    })
})
