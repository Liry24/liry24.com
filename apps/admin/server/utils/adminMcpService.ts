import type { R2Bucket } from '@cloudflare/workers-types'
import { schema, type Database } from '@repo/database'
import {
    artsInsertSchema,
    artsUpdateSchema,
    careersInsertSchema,
    careersUpdateSchema,
    postsInsertSchema,
    postsUpdateSchema,
    ranksInsertSchema,
    ranksUpdateSchema,
    skillsInsertSchema,
    skillsUpdateSchema,
    socialsInsertSchema,
    socialsUpdateSchema,
    worksInsertSchema,
    worksUpdateSchema,
} from '@repo/database/types'
import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { ZodType } from 'zod'

import { normalizePostSlug } from './postService'

const PLAN_TTL_MS = 10 * 60_000
const RETRY_TTL_MS = 24 * 60 * 60_000
const EXTERNAL_ACTIONS = new Set([
    'set_user_role',
    'ban_user',
    'unban_user',
    'revoke_user_sessions',
    'import_upload_url',
])

export type AdminActor = {
    userId: string
    clientId: string
    headers: Headers
}

type OperationResult = {
    index: number
    action: string
    resource: string
    resourceId?: string
    status: 'succeeded' | 'failed' | 'skipped'
    auditId?: string
    error?: string
    output?: Record<string, unknown>
}

type PlanResult = {
    d1Applied: boolean
    operations: OperationResult[]
}

const safeError = (error: unknown) =>
    (error instanceof Error ? error.message : String(error))
        .replace(/https?:\/\/\S+/giu, '[url]')
        .replace(/bearer\s+\S+/giu, 'Bearer [redacted]')
        .slice(0, 1_000)

const jsonClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const stableValue = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stableValue)
    if (!value || typeof value !== 'object') return value
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, nested]) => [key, stableValue(nested)]),
    )
}

const sha256 = async (value: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(stableValue(value)))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const parseCursor = (cursor: string | undefined) => {
    if (!cursor) return 0
    const value = Number.parseInt(cursor, 10)
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid cursor')
    return value
}

const withCursor = <T>(rows: T[], offset: number, limit: number) => ({
    items: rows.slice(0, limit),
    nextCursor: rows.length > limit ? String(offset + limit) : null,
})

export const enforceMcpRateLimit = async (
    database: Database,
    actor: AdminActor,
    bucket: 'read' | 'apply',
) => {
    const now = Date.now()
    const windowMs = 60_000
    const max = bucket === 'read' ? 60 : 10
    const key = `mcp:${bucket}:${actor.userId}:${actor.clientId}`
    const current = await database.query.rateLimits.findFirst({
        where: { key: { eq: key } },
    })

    if (!current) {
        await database
            .insert(schema.rateLimits)
            .values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
            .onConflictDoNothing()
        return
    }

    if (now - current.lastRequest >= windowMs) {
        await database
            .update(schema.rateLimits)
            .set({ count: 1, lastRequest: now })
            .where(eq(schema.rateLimits.key, key))
        return
    }

    if (current.count >= max) throw new Error('MCP rate limit exceeded')
    await database
        .update(schema.rateLimits)
        .set({ count: current.count + 1, lastRequest: now })
        .where(
            and(
                eq(schema.rateLimits.key, key),
                eq(schema.rateLimits.count, current.count),
                eq(schema.rateLimits.lastRequest, current.lastRequest),
            ),
        )
}

const searchPattern = (search: string | undefined) =>
    search ? `%${search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%` : undefined

export const queryAdminResources = async (
    database: Database,
    input: {
        resource: QueryResource
        id?: string | number
        search?: string
        status?: string
        cursor?: string
        limit: number
    },
) => {
    const offset = parseCursor(input.cursor)
    const limit = input.limit
    const take = limit + 1
    const pattern = searchPattern(input.search)
    const numericId =
        typeof input.id === 'number'
            ? input.id
            : input.id
              ? Number.parseInt(input.id, 10)
              : undefined

    let rows: unknown[]
    switch (input.resource) {
        case 'posts': {
            const conditions = [
                typeof input.id === 'string' ? eq(schema.posts.slug, input.id) : undefined,
                pattern
                    ? or(
                          like(schema.posts.slug, pattern),
                          like(schema.posts.title, pattern),
                          like(schema.posts.excerpt, pattern),
                      )
                    : undefined,
                input.status && ['draft', 'scheduled', 'published'].includes(input.status)
                    ? eq(schema.posts.status, input.status as 'draft' | 'scheduled' | 'published')
                    : undefined,
            ].filter(Boolean)
            const posts = await database
                .select()
                .from(schema.posts)
                .where(conditions.length ? and(...conditions) : undefined)
                .orderBy(desc(schema.posts.updatedAt))
                .limit(take)
                .offset(offset)
            const slugs = posts.map((post) => post.slug)
            const tags = slugs.length
                ? await database
                      .select()
                      .from(schema.postTags)
                      .where(inArray(schema.postTags.postSlug, slugs))
                : []
            rows = posts.map((post) => ({
                ...post,
                tags: tags.filter((tag) => tag.postSlug === post.slug).map((tag) => tag.tag),
            }))
            break
        }
        case 'works':
            rows = await database
                .select()
                .from(schema.works)
                .where(
                    typeof input.id === 'string'
                        ? eq(schema.works.slug, input.id)
                        : pattern
                          ? or(
                                like(schema.works.slug, pattern),
                                like(schema.works.title, pattern),
                                like(schema.works.description, pattern),
                            )
                          : undefined,
                )
                .orderBy(asc(schema.works.sortIndex))
                .limit(take)
                .offset(offset)
            break
        case 'arts': {
            const arts = await database
                .select()
                .from(schema.arts)
                .where(
                    typeof input.id === 'string'
                        ? eq(schema.arts.slug, input.id)
                        : pattern
                          ? or(
                                like(schema.arts.slug, pattern),
                                like(schema.arts.title, pattern),
                                like(schema.arts.description, pattern),
                            )
                          : undefined,
                )
                .orderBy(asc(schema.arts.sortIndex))
                .limit(take)
                .offset(offset)
            const slugs = arts.map((art) => art.slug)
            const images = slugs.length
                ? await database
                      .select()
                      .from(schema.artImages)
                      .where(inArray(schema.artImages.artSlug, slugs))
                : []
            rows = arts.map((art) => ({
                ...art,
                images: images.filter((image) => image.artSlug === art.slug),
            }))
            break
        }
        case 'socials':
            rows = await database
                .select()
                .from(schema.socials)
                .where(
                    Number.isSafeInteger(numericId)
                        ? eq(schema.socials.id, numericId!)
                        : pattern
                          ? or(
                                like(schema.socials.label, pattern),
                                like(schema.socials.alias, pattern),
                                like(schema.socials.href, pattern),
                            )
                          : undefined,
                )
                .orderBy(asc(schema.socials.sortIndex))
                .limit(take)
                .offset(offset)
            break
        case 'skills':
            rows = await database
                .select()
                .from(schema.skills)
                .where(
                    Number.isSafeInteger(numericId)
                        ? eq(schema.skills.id, numericId!)
                        : pattern
                          ? or(
                                like(schema.skills.name, pattern),
                                like(schema.skills.category, pattern),
                            )
                          : undefined,
                )
                .orderBy(asc(schema.skills.sortIndex))
                .limit(take)
                .offset(offset)
            break
        case 'careers':
            rows = await database
                .select()
                .from(schema.careers)
                .where(
                    Number.isSafeInteger(numericId)
                        ? eq(schema.careers.id, numericId!)
                        : pattern
                          ? or(
                                like(schema.careers.company, pattern),
                                like(schema.careers.position, pattern),
                                like(schema.careers.period, pattern),
                            )
                          : undefined,
                )
                .orderBy(asc(schema.careers.sortIndex))
                .limit(take)
                .offset(offset)
            break
        case 'ranks':
            rows = await database
                .select()
                .from(schema.ranks)
                .where(
                    Number.isSafeInteger(numericId)
                        ? eq(schema.ranks.id, numericId!)
                        : pattern
                          ? or(
                                like(schema.ranks.game, pattern),
                                like(schema.ranks.rank, pattern),
                                like(schema.ranks.season, pattern),
                            )
                          : undefined,
                )
                .orderBy(asc(schema.ranks.sortIndex))
                .limit(take)
                .offset(offset)
            break
        case 'users':
            rows = await database
                .select({
                    id: schema.users.id,
                    name: schema.users.name,
                    email: schema.users.email,
                    emailVerified: schema.users.emailVerified,
                    image: schema.users.image,
                    role: schema.users.role,
                    banned: schema.users.banned,
                    banReason: schema.users.banReason,
                    banExpires: schema.users.banExpires,
                    createdAt: schema.users.createdAt,
                    updatedAt: schema.users.updatedAt,
                })
                .from(schema.users)
                .where(
                    typeof input.id === 'string'
                        ? eq(schema.users.id, input.id)
                        : pattern
                          ? or(like(schema.users.name, pattern), like(schema.users.email, pattern))
                          : undefined,
                )
                .orderBy(desc(schema.users.createdAt))
                .limit(take)
                .offset(offset)
            break
        case 'post_reviews':
            rows = await database
                .select()
                .from(schema.postReviews)
                .where(
                    typeof input.id === 'string'
                        ? eq(schema.postReviews.id, input.id)
                        : and(
                              pattern ? like(schema.postReviews.postSlug, pattern) : undefined,
                              input.status && ['completed', 'failed'].includes(input.status)
                                  ? eq(
                                        schema.postReviews.status,
                                        input.status as 'completed' | 'failed',
                                    )
                                  : undefined,
                          ),
                )
                .orderBy(desc(schema.postReviews.createdAt))
                .limit(take)
                .offset(offset)
            break
        case 'audit_events':
            rows = await database
                .select()
                .from(schema.adminAuditEvents)
                .where(
                    typeof input.id === 'string'
                        ? eq(schema.adminAuditEvents.id, input.id)
                        : pattern
                          ? or(
                                like(schema.adminAuditEvents.action, pattern),
                                like(schema.adminAuditEvents.resource, pattern),
                                like(schema.adminAuditEvents.resourceId, pattern),
                            )
                          : undefined,
                )
                .orderBy(desc(schema.adminAuditEvents.createdAt))
                .limit(take)
                .offset(offset)
            break
    }

    return withCursor(rows, offset, limit)
}

const insertSchemaFor = (resource: ContentResource): ZodType => {
    switch (resource) {
        case 'posts':
            return postsInsertSchema.omit({ createdAt: true, updatedAt: true })
        case 'works':
            return worksInsertSchema.omit({ createdAt: true })
        case 'arts':
            return artsInsertSchema
        case 'socials':
            return socialsInsertSchema
        case 'skills':
            return skillsInsertSchema
        case 'careers':
            return careersInsertSchema
        case 'ranks':
            return ranksInsertSchema
    }
}

const updateSchemaFor = (resource: ContentResource): ZodType => {
    switch (resource) {
        case 'posts':
            return postsUpdateSchema.omit({
                slug: true,
                createdAt: true,
                updatedAt: true,
            })
        case 'works':
            return worksUpdateSchema.omit({ slug: true, createdAt: true })
        case 'arts':
            return artsUpdateSchema.omit({ slug: true })
        case 'socials':
            return socialsUpdateSchema.omit({ id: true })
        case 'skills':
            return skillsUpdateSchema.omit({ id: true })
        case 'careers':
            return careersUpdateSchema.omit({ id: true })
        case 'ranks':
            return ranksUpdateSchema.omit({ id: true })
    }
}

const getRecord = async (database: Database, resource: string, id: string | number) => {
    const result = await queryAdminResources(database, {
        resource: resource as QueryResource,
        id,
        limit: 1,
    })
    return result.items[0] ?? null
}

const nextSortIndex = async (database: Database, resource: ContentResource) => {
    switch (resource) {
        case 'works':
            return (
                await database
                    .select({
                        value: sql<number>`coalesce(max(${schema.works.sortIndex}), -1) + 1`,
                    })
                    .from(schema.works)
            )[0]!.value
        case 'arts':
            return (
                await database
                    .select({ value: sql<number>`coalesce(max(${schema.arts.sortIndex}), -1) + 1` })
                    .from(schema.arts)
            )[0]!.value
        case 'socials':
            return (
                await database
                    .select({
                        value: sql<number>`coalesce(max(${schema.socials.sortIndex}), -1) + 1`,
                    })
                    .from(schema.socials)
            )[0]!.value
        case 'skills':
            return (
                await database
                    .select({
                        value: sql<number>`coalesce(max(${schema.skills.sortIndex}), -1) + 1`,
                    })
                    .from(schema.skills)
            )[0]!.value
        case 'careers':
            return (
                await database
                    .select({
                        value: sql<number>`coalesce(max(${schema.careers.sortIndex}), -1) + 1`,
                    })
                    .from(schema.careers)
            )[0]!.value
        case 'ranks':
            return (
                await database
                    .select({
                        value: sql<number>`coalesce(max(${schema.ranks.sortIndex}), -1) + 1`,
                    })
                    .from(schema.ranks)
            )[0]!.value
        case 'posts':
            return 0
    }
}

const uniqueSlug = async (
    database: Database,
    resource: 'posts' | 'works' | 'arts',
    requested: unknown,
    title: unknown,
    reserved: Set<string>,
) => {
    const base =
        normalizePostSlug(
            typeof requested === 'string' ? requested : typeof title === 'string' ? title : '',
        ) || `${resource.slice(0, -1)}-${crypto.randomUUID().slice(0, 8)}`
    for (let suffix = 1; suffix <= 100; suffix += 1) {
        const candidate = suffix === 1 ? base : `${base}-${suffix}`
        if (reserved.has(`${resource}:${candidate}`)) continue
        if (!(await getRecord(database, resource, candidate))) {
            reserved.add(`${resource}:${candidate}`)
            return candidate
        }
    }
    throw new Error(`Could not generate a unique ${resource} slug`)
}

const canonicalizeOperations = async (
    database: Database,
    actor: AdminActor,
    operations: AdminOperation[],
) => {
    const reserved = new Set<string>()
    const canonical: AdminOperation[] = []

    for (const raw of operations) {
        const operation = jsonClone(raw)
        if (operation.action === 'create') {
            const data = insertSchemaFor(operation.resource).parse(operation.data) as Record<
                string,
                unknown
            >
            if (['posts', 'works', 'arts'].includes(operation.resource)) {
                data.slug = await uniqueSlug(
                    database,
                    operation.resource as 'posts' | 'works' | 'arts',
                    data.slug,
                    data.title,
                    reserved,
                )
            }
            if (operation.resource !== 'posts' && data.sortIndex === undefined)
                data.sortIndex = await nextSortIndex(database, operation.resource)
            operation.data = jsonClone(data)
        } else if (operation.action === 'update') {
            const before = await getRecord(database, operation.resource, operation.id)
            if (!before) throw new Error(`${operation.resource} ${operation.id} was not found`)
            if (
                operation.resource === 'posts' &&
                (before as { status?: string }).status === 'published'
            )
                throw new Error('Published posts cannot be edited')
            operation.data = jsonClone(
                updateSchemaFor(operation.resource).parse(operation.data) as Record<
                    string,
                    unknown
                >,
            )
        } else if (operation.action === 'delete') {
            if (!(await getRecord(database, operation.resource, operation.id)))
                throw new Error(`${operation.resource} ${operation.id} was not found`)
        } else if (operation.action === 'reorder') {
            const uniqueIds = new Set(operation.ids.map(String))
            if (uniqueIds.size !== operation.ids.length)
                throw new Error('Reorder IDs must be unique')
            for (const id of operation.ids)
                if (!(await getRecord(database, operation.resource, id)))
                    throw new Error(`${operation.resource} ${id} was not found`)
        } else if (
            operation.action === 'schedule_post' ||
            operation.action === 'publish_post' ||
            operation.action === 'request_post_review'
        ) {
            const post = await getRecord(database, 'posts', operation.id)
            if (!post) throw new Error(`posts ${operation.id} was not found`)
            if (
                operation.action !== 'request_post_review' &&
                (post as { status?: string }).status === 'published'
            )
                throw new Error('The post is already published')
            if (
                operation.action === 'schedule_post' &&
                new Date(operation.scheduledAt).getTime() <= Date.now()
            )
                throw new Error('scheduledAt must be in the future')
        } else if (
            operation.action === 'set_user_role' ||
            operation.action === 'ban_user' ||
            operation.action === 'unban_user' ||
            operation.action === 'revoke_user_sessions'
        ) {
            if (!(await getRecord(database, 'users', operation.id)))
                throw new Error(`users ${operation.id} was not found`)
            if (
                operation.id === actor.userId &&
                (operation.action === 'ban_user' ||
                    operation.action === 'revoke_user_sessions' ||
                    (operation.action === 'set_user_role' && operation.role !== 'admin'))
            )
                throw new Error('An administrator cannot lock out their own account')
        } else if (operation.action === 'import_upload_url') {
            operation.key = normalizeAdminUploadKey(operation.key)
            assertSafeImportUrl(operation.sourceUrl)
        }
        canonical.push(operation)
    }
    return canonical
}

const captureSnapshots = async (database: Database, operations: AdminOperation[]) => {
    const snapshots: unknown[] = []
    for (const operation of operations) {
        if (operation.action === 'create' || operation.action === 'import_upload_url') {
            snapshots.push(null)
        } else if (operation.action === 'reorder') {
            snapshots.push(
                await Promise.all(
                    operation.ids.map((id) => getRecord(database, operation.resource, id)),
                ),
            )
        } else {
            snapshots.push(await getRecord(database, operation.resource, operation.id))
        }
    }
    return jsonClone(snapshots)
}

const plannedAfter = (operation: AdminOperation, before: unknown) => {
    switch (operation.action) {
        case 'create':
            return operation.data
        case 'update':
            return { ...(before as Record<string, unknown>), ...operation.data }
        case 'delete':
            return null
        case 'reorder':
            return operation.ids.map((id, sortIndex) => ({ id, sortIndex }))
        case 'schedule_post':
            return {
                ...(before as Record<string, unknown>),
                status: 'scheduled',
                scheduledAt: operation.scheduledAt,
            }
        case 'publish_post':
            return {
                ...(before as Record<string, unknown>),
                status: 'published',
                scheduledAt: null,
            }
        case 'request_post_review':
            return { postSlug: operation.id, review: 'queued' }
        case 'set_user_role':
            return { ...(before as Record<string, unknown>), role: operation.role }
        case 'ban_user':
            return { ...(before as Record<string, unknown>), banned: true }
        case 'unban_user':
            return { ...(before as Record<string, unknown>), banned: false }
        case 'revoke_user_sessions':
            return { userId: operation.id, sessions: 'revoked' }
        case 'import_upload_url':
            return { key: operation.key, source: '[validated HTTPS URL]' }
    }
}

export const prepareAdminPlan = async (
    database: Database,
    actor: AdminActor,
    inputOperations: AdminOperation[],
) => {
    const operations = await canonicalizeOperations(database, actor, inputOperations)
    const snapshots = await captureSnapshots(database, operations)
    const snapshotHash = await sha256(snapshots)
    const id = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + PLAN_TTL_MS)

    await database.insert(schema.adminActionPlans).values({
        id,
        actorUserId: actor.userId,
        clientId: actor.clientId,
        operations,
        snapshot: snapshots,
        snapshotHash,
        status: 'pending',
        expiresAt,
    })

    return {
        planId: id,
        expiresAt: expiresAt.toISOString(),
        operationCount: operations.length,
        diffs: operations.map((operation, index) => ({
            index,
            action: operation.action,
            resource: operation.resource,
            before: snapshots[index],
            after: plannedAfter(operation, snapshots[index]),
        })),
        confirmationRequired: true,
    }
}

const resourceIdFor = (operation: AdminOperation) => {
    if ('id' in operation) return String(operation.id)
    if (operation.action === 'create' && 'slug' in operation.data)
        return String(operation.data.slug)
    if (operation.action === 'import_upload_url') return operation.key
    return undefined
}

const toDate = (value: unknown) =>
    typeof value === 'string' || value instanceof Date ? new Date(value) : undefined

const pushContentStatements = (
    database: Database,
    statements: BatchItem<'sqlite'>[],
    operation: AdminOperation,
    actorUserId: string,
    postAutomation?: {
        schedule?: { revision: string; instanceId: string }
        reviewJob?: { id: string; input: { title: string; excerpt: string; content: string } }
    },
) => {
    if (operation.action === 'create') {
        const data = operation.data
        switch (operation.resource) {
            case 'posts': {
                const status = (data.status as 'draft' | 'scheduled' | undefined) ?? 'draft'
                statements.push(
                    database.insert(schema.posts).values({
                        slug: String(data.slug),
                        title: String(data.title),
                        excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
                        content: String(data.content),
                        status,
                        scheduledAt: status === 'scheduled' ? toDate(data.scheduledAt) : null,
                        scheduleRevision: postAutomation?.schedule?.revision ?? null,
                        publishWorkflowInstanceId: postAutomation?.schedule?.instanceId ?? null,
                        publishWorkflowEngine: postAutomation?.schedule ? 'workflow-v1' : null,
                        publishedAt: null,
                        authorUserId: actorUserId,
                    }),
                )
                const tags = Array.isArray(data.tags) ? data.tags.map(String) : []
                if (tags.length)
                    statements.push(
                        database
                            .insert(schema.postTags)
                            .values(tags.map((tag) => ({ postSlug: String(data.slug), tag }))),
                    )
                break
            }
            case 'works':
                statements.push(
                    database.insert(schema.works).values({
                        ...(data as typeof schema.works.$inferInsert),
                        slug: String(data.slug),
                    }),
                )
                break
            case 'arts': {
                const { images, ...art } = data
                statements.push(
                    database.insert(schema.arts).values({
                        ...(art as typeof schema.arts.$inferInsert),
                        slug: String(data.slug),
                    }),
                )
                if (Array.isArray(images) && images.length)
                    statements.push(
                        database.insert(schema.artImages).values(
                            images.map((image) => ({
                                artSlug: String(data.slug),
                                src: String((image as Record<string, unknown>).src),
                                alt:
                                    typeof (image as Record<string, unknown>).alt === 'string'
                                        ? String((image as Record<string, unknown>).alt)
                                        : null,
                            })),
                        ),
                    )
                break
            }
            case 'socials':
                statements.push(
                    database
                        .insert(schema.socials)
                        .values(data as typeof schema.socials.$inferInsert),
                )
                break
            case 'skills':
                statements.push(
                    database
                        .insert(schema.skills)
                        .values(data as typeof schema.skills.$inferInsert),
                )
                break
            case 'careers':
                statements.push(
                    database
                        .insert(schema.careers)
                        .values(data as typeof schema.careers.$inferInsert),
                )
                break
            case 'ranks':
                statements.push(
                    database.insert(schema.ranks).values(data as typeof schema.ranks.$inferInsert),
                )
                break
        }
        return
    }

    if (operation.action === 'update') {
        const data = operation.data
        switch (operation.resource) {
            case 'posts': {
                const { tags, scheduledAt, ...post } = data
                statements.push(
                    database
                        .update(schema.posts)
                        .set({
                            ...(post as Partial<typeof schema.posts.$inferInsert>),
                            ...(scheduledAt !== undefined
                                ? { scheduledAt: scheduledAt ? toDate(scheduledAt) : null }
                                : {}),
                        })
                        .where(eq(schema.posts.slug, String(operation.id))),
                )
                if (Array.isArray(tags)) {
                    statements.push(
                        database
                            .delete(schema.postTags)
                            .where(eq(schema.postTags.postSlug, String(operation.id))),
                    )
                    if (tags.length)
                        statements.push(
                            database.insert(schema.postTags).values(
                                tags.map((tag) => ({
                                    postSlug: String(operation.id),
                                    tag: String(tag),
                                })),
                            ),
                        )
                }
                break
            }
            case 'works':
                statements.push(
                    database
                        .update(schema.works)
                        .set(data as Partial<typeof schema.works.$inferInsert>)
                        .where(eq(schema.works.slug, String(operation.id))),
                )
                break
            case 'arts': {
                const { images, ...art } = data
                statements.push(
                    database
                        .update(schema.arts)
                        .set(art as Partial<typeof schema.arts.$inferInsert>)
                        .where(eq(schema.arts.slug, String(operation.id))),
                )
                if (Array.isArray(images)) {
                    statements.push(
                        database
                            .delete(schema.artImages)
                            .where(eq(schema.artImages.artSlug, String(operation.id))),
                    )
                    if (images.length)
                        statements.push(
                            database.insert(schema.artImages).values(
                                images.map((image) => ({
                                    artSlug: String(operation.id),
                                    src: String((image as Record<string, unknown>).src),
                                    alt:
                                        typeof (image as Record<string, unknown>).alt === 'string'
                                            ? String((image as Record<string, unknown>).alt)
                                            : null,
                                })),
                            ),
                        )
                }
                break
            }
            case 'socials':
                statements.push(
                    database
                        .update(schema.socials)
                        .set(data as Partial<typeof schema.socials.$inferInsert>)
                        .where(eq(schema.socials.id, Number(operation.id))),
                )
                break
            case 'skills':
                statements.push(
                    database
                        .update(schema.skills)
                        .set(data as Partial<typeof schema.skills.$inferInsert>)
                        .where(eq(schema.skills.id, Number(operation.id))),
                )
                break
            case 'careers':
                statements.push(
                    database
                        .update(schema.careers)
                        .set(data as Partial<typeof schema.careers.$inferInsert>)
                        .where(eq(schema.careers.id, Number(operation.id))),
                )
                break
            case 'ranks':
                statements.push(
                    database
                        .update(schema.ranks)
                        .set(data as Partial<typeof schema.ranks.$inferInsert>)
                        .where(eq(schema.ranks.id, Number(operation.id))),
                )
                break
        }
        return
    }

    if (operation.action === 'delete') {
        switch (operation.resource) {
            case 'posts':
                statements.push(
                    database
                        .delete(schema.posts)
                        .where(eq(schema.posts.slug, String(operation.id))),
                )
                break
            case 'works':
                statements.push(
                    database
                        .delete(schema.works)
                        .where(eq(schema.works.slug, String(operation.id))),
                )
                break
            case 'arts':
                statements.push(
                    database.delete(schema.arts).where(eq(schema.arts.slug, String(operation.id))),
                )
                break
            case 'socials':
                statements.push(
                    database
                        .delete(schema.socials)
                        .where(eq(schema.socials.id, Number(operation.id))),
                )
                break
            case 'skills':
                statements.push(
                    database
                        .delete(schema.skills)
                        .where(eq(schema.skills.id, Number(operation.id))),
                )
                break
            case 'careers':
                statements.push(
                    database
                        .delete(schema.careers)
                        .where(eq(schema.careers.id, Number(operation.id))),
                )
                break
            case 'ranks':
                statements.push(
                    database.delete(schema.ranks).where(eq(schema.ranks.id, Number(operation.id))),
                )
                break
        }
        return
    }

    if (operation.action === 'reorder') {
        for (const [sortIndex, id] of operation.ids.entries()) {
            switch (operation.resource) {
                case 'works':
                    statements.push(
                        database
                            .update(schema.works)
                            .set({ sortIndex })
                            .where(eq(schema.works.slug, String(id))),
                    )
                    break
                case 'arts':
                    statements.push(
                        database
                            .update(schema.arts)
                            .set({ sortIndex })
                            .where(eq(schema.arts.slug, String(id))),
                    )
                    break
                case 'socials':
                    statements.push(
                        database
                            .update(schema.socials)
                            .set({ sortIndex })
                            .where(eq(schema.socials.id, Number(id))),
                    )
                    break
                case 'skills':
                    statements.push(
                        database
                            .update(schema.skills)
                            .set({ sortIndex })
                            .where(eq(schema.skills.id, Number(id))),
                    )
                    break
                case 'careers':
                    statements.push(
                        database
                            .update(schema.careers)
                            .set({ sortIndex })
                            .where(eq(schema.careers.id, Number(id))),
                    )
                    break
                case 'ranks':
                    statements.push(
                        database
                            .update(schema.ranks)
                            .set({ sortIndex })
                            .where(eq(schema.ranks.id, Number(id))),
                    )
                    break
            }
        }
        return
    }

    switch (operation.action) {
        case 'schedule_post':
            statements.push(
                database
                    .update(schema.posts)
                    .set({
                        status: 'scheduled',
                        scheduledAt: new Date(operation.scheduledAt),
                        scheduleRevision: postAutomation?.schedule?.revision ?? null,
                        publishWorkflowInstanceId: postAutomation?.schedule?.instanceId ?? null,
                        publishWorkflowEngine: postAutomation?.schedule ? 'workflow-v1' : null,
                    })
                    .where(eq(schema.posts.slug, operation.id)),
            )
            break
        case 'publish_post':
            statements.push(
                database
                    .update(schema.posts)
                    .set({
                        status: 'published',
                        publishedAt: new Date(),
                        scheduledAt: null,
                        scheduleRevision: null,
                        publishWorkflowInstanceId: null,
                        publishWorkflowEngine: null,
                    })
                    .where(eq(schema.posts.slug, operation.id)),
            )
            break
        case 'request_post_review':
            statements.push(
                database.insert(schema.postReviewJobs).values({
                    id: postAutomation?.reviewJob?.id ?? crypto.randomUUID(),
                    postSlug: operation.id,
                    input: postAutomation?.reviewJob?.input ?? {
                        title: '',
                        excerpt: '',
                        content: '',
                    },
                    status: 'pending',
                    attempts: 0,
                    availableAt: new Date(),
                }),
            )
            break
    }
}

const auditStatement = (database: Database, values: typeof schema.adminAuditEvents.$inferInsert) =>
    database.insert(schema.adminAuditEvents).values(values)

const loadPlanResult = (value: unknown): PlanResult => {
    if (!value || typeof value !== 'object') return { d1Applied: false, operations: [] }
    const record = value as Partial<PlanResult>
    return {
        d1Applied: record.d1Applied === true,
        operations: Array.isArray(record.operations) ? record.operations : [],
    }
}

const executeExternalOperation = async (
    operation: AdminOperation,
    actor: AdminActor,
    r2: R2Bucket,
    imageBaseUrl: string,
    auth: Auth,
) => {
    const authContext = await auth.$context
    switch (operation.action) {
        case 'set_user_role':
            await authContext.internalAdapter.updateUser(operation.id, {
                role: operation.role,
                updatedAt: new Date(),
            })
            return { role: operation.role }
        case 'ban_user':
            await authContext.internalAdapter.updateUser(operation.id, {
                banned: true,
                banReason: operation.reason,
                banExpires: operation.expiresInSeconds
                    ? new Date(Date.now() + operation.expiresInSeconds * 1_000)
                    : null,
                updatedAt: new Date(),
            })
            await authContext.internalAdapter.deleteUserSessions(operation.id)
            return { banned: true }
        case 'unban_user':
            await authContext.internalAdapter.updateUser(operation.id, {
                banned: false,
                banReason: null,
                banExpires: null,
                updatedAt: new Date(),
            })
            return { banned: false }
        case 'revoke_user_sessions':
            await authContext.internalAdapter.deleteUserSessions(operation.id)
            return { sessionsRevoked: true }
        case 'import_upload_url': {
            const existing = await r2.head(operation.key)
            if (existing)
                return {
                    key: operation.key,
                    publicUrl: `${imageBaseUrl}/${operation.key}`,
                    alreadyExisted: true,
                }
            try {
                const source = await fetchSafeImage(operation.sourceUrl)
                const body = await new Response(source.body).arrayBuffer()
                await r2.put(operation.key, body, {
                    httpMetadata: { contentType: source.contentType },
                    customMetadata: { importedBy: actor.userId },
                })
            } catch (error) {
                await r2.delete(operation.key)
                throw error
            }
            return {
                key: operation.key,
                publicUrl: `${imageBaseUrl}/${operation.key}`,
                maxBytes: MAX_ADMIN_UPLOAD_BYTES,
            }
        }
        default:
            throw new Error('Operation is not external')
    }
}

export const applyAdminPlan = async (
    database: Database,
    actor: AdminActor,
    planId: string,
    r2: R2Bucket,
    imageBaseUrl: string,
    auth: Auth,
    automation?: PostAutomation,
) => {
    const plan = await database.query.adminActionPlans.findFirst({
        where: { id: { eq: planId } },
    })
    if (!plan) throw new Error('Plan not found')
    if (plan.actorUserId !== actor.userId || plan.clientId !== actor.clientId)
        throw new Error('Plan belongs to a different actor or OAuth client')
    if (plan.status === 'applied') return loadPlanResult(plan.result)
    if (plan.status === 'applying') throw new Error('Plan is already being applied')

    const now = new Date()
    const retrying = plan.status === 'partially_failed'
    if (
        (!retrying && plan.expiresAt <= now) ||
        (retrying && (!plan.retryExpiresAt || plan.retryExpiresAt <= now))
    ) {
        await database
            .update(schema.adminActionPlans)
            .set({ status: 'expired' })
            .where(eq(schema.adminActionPlans.id, plan.id))
        throw new Error('Plan has expired')
    }

    const claimed = await database
        .update(schema.adminActionPlans)
        .set({ status: 'applying' })
        .where(
            and(
                eq(schema.adminActionPlans.id, plan.id),
                inArray(schema.adminActionPlans.status, ['pending', 'partially_failed']),
            ),
        )
        .returning({ id: schema.adminActionPlans.id })
    if (!claimed.length) throw new Error('Plan could not be claimed')

    const operations = plan.operations as AdminOperation[]
    const snapshots = plan.snapshot
    let result = loadPlanResult(plan.result)

    try {
        if (!result.d1Applied) {
            const currentSnapshots = await captureSnapshots(database, operations)
            if ((await sha256(currentSnapshots)) !== plan.snapshotHash) {
                await database
                    .update(schema.adminActionPlans)
                    .set({
                        status: 'pending',
                        result: {
                            ...result,
                            conflict: 'One or more resources changed after prepare',
                        },
                    })
                    .where(eq(schema.adminActionPlans.id, plan.id))
                throw new Error('Plan is stale; prepare a new plan')
            }

            const statements: BatchItem<'sqlite'>[] = []
            const d1Results: OperationResult[] = []
            for (const [index, operation] of operations.entries()) {
                if (EXTERNAL_ACTIONS.has(operation.action)) continue
                const snapshot = snapshots[index] as Record<string, unknown> | null
                let operationAutomation:
                    | {
                          schedule?: { revision: string; instanceId: string }
                          reviewJob?: {
                              id: string
                              input: { title: string; excerpt: string; content: string }
                          }
                      }
                    | undefined
                if (operation.action === 'request_post_review') {
                    const input = {
                        title: typeof snapshot?.title === 'string' ? snapshot.title : '',
                        excerpt: typeof snapshot?.excerpt === 'string' ? snapshot.excerpt : '',
                        content: typeof snapshot?.content === 'string' ? snapshot.content : '',
                    }
                    if (!automation?.reviewQueue)
                        throw new Error('Post review queue binding is not configured')
                    const id = crypto.randomUUID()
                    await automation.reviewQueue.send({ jobId: id })
                    operationAutomation = { reviewJob: { id, input } }
                }
                if (operation.action === 'schedule_post') {
                    const schedule = await createPublishWorkflow(
                        automation,
                        operation.id,
                        new Date(operation.scheduledAt),
                    )
                    operationAutomation = { schedule }
                }
                if (operation.action === 'create' && operation.resource === 'posts') {
                    const scheduledAt = toDate(operation.data.scheduledAt)
                    if (operation.data.status === 'scheduled' && scheduledAt) {
                        const schedule = await createPublishWorkflow(
                            automation,
                            String(operation.data.slug),
                            scheduledAt,
                        )
                        operationAutomation = { schedule }
                    }
                }
                pushContentStatements(
                    database,
                    statements,
                    operation,
                    actor.userId,
                    operationAutomation,
                )
                const auditId = crypto.randomUUID()
                statements.push(
                    auditStatement(database, {
                        id: auditId,
                        planId: plan.id,
                        actorUserId: actor.userId,
                        clientId: actor.clientId,
                        source: 'mcp',
                        action: operation.action,
                        resource: operation.resource,
                        resourceId: resourceIdFor(operation),
                        before: snapshots[index],
                        after: plannedAfter(operation, snapshots[index]),
                        outcome: 'succeeded',
                    }),
                )
                d1Results.push({
                    index,
                    action: operation.action,
                    resource: operation.resource,
                    resourceId: resourceIdFor(operation),
                    status: 'succeeded',
                    auditId,
                })
            }

            result = {
                d1Applied: true,
                operations: [
                    ...result.operations.filter((item) => EXTERNAL_ACTIONS.has(item.action)),
                    ...d1Results,
                ].sort((left, right) => left.index - right.index),
            }
            statements.push(
                database
                    .update(schema.adminActionPlans)
                    .set({ result })
                    .where(eq(schema.adminActionPlans.id, plan.id)),
            )
            await database.batch([statements[0]!, ...statements.slice(1)])
        }

        for (const [index, operation] of operations.entries()) {
            if (!EXTERNAL_ACTIONS.has(operation.action)) continue
            const previous = result.operations.find((item) => item.index === index)
            if (previous?.status === 'succeeded') continue

            const auditId = crypto.randomUUID()
            try {
                const output = await executeExternalOperation(
                    operation,
                    actor,
                    r2,
                    imageBaseUrl.replace(/\/$/u, ''),
                    auth,
                )
                const next: OperationResult = {
                    index,
                    action: operation.action,
                    resource: operation.resource,
                    resourceId: resourceIdFor(operation),
                    status: 'succeeded',
                    auditId,
                    output,
                }
                result.operations = [
                    ...result.operations.filter((item) => item.index !== index),
                    next,
                ].sort((left, right) => left.index - right.index)
                await database.batch([
                    auditStatement(database, {
                        id: auditId,
                        planId: plan.id,
                        actorUserId: actor.userId,
                        clientId: actor.clientId,
                        source: 'mcp',
                        action: operation.action,
                        resource: operation.resource,
                        resourceId: resourceIdFor(operation),
                        before: snapshots[index],
                        after: plannedAfter(operation, snapshots[index]),
                        outcome: 'succeeded',
                    }),
                    database
                        .update(schema.adminActionPlans)
                        .set({ result })
                        .where(eq(schema.adminActionPlans.id, plan.id)),
                ])
            } catch (error) {
                const message = safeError(error)
                const next: OperationResult = {
                    index,
                    action: operation.action,
                    resource: operation.resource,
                    resourceId: resourceIdFor(operation),
                    status: 'failed',
                    auditId,
                    error: message,
                }
                result.operations = [
                    ...result.operations.filter((item) => item.index !== index),
                    next,
                ].sort((left, right) => left.index - right.index)
                await database.batch([
                    auditStatement(database, {
                        id: auditId,
                        planId: plan.id,
                        actorUserId: actor.userId,
                        clientId: actor.clientId,
                        source: 'mcp',
                        action: operation.action,
                        resource: operation.resource,
                        resourceId: resourceIdFor(operation),
                        before: snapshots[index],
                        after: plannedAfter(operation, snapshots[index]),
                        outcome: 'failed',
                        error: message,
                    }),
                    database
                        .update(schema.adminActionPlans)
                        .set({ result })
                        .where(eq(schema.adminActionPlans.id, plan.id)),
                ])
            }
        }

        const failed = result.operations.filter((item) => item.status === 'failed')
        await database
            .update(schema.adminActionPlans)
            .set({
                status: failed.length ? 'partially_failed' : 'applied',
                result,
                appliedAt: failed.length ? null : new Date(),
                retryExpiresAt: failed.length
                    ? (plan.retryExpiresAt ?? new Date(Date.now() + RETRY_TTL_MS))
                    : null,
            })
            .where(eq(schema.adminActionPlans.id, plan.id))
        return result
    } catch (error) {
        const latest = await database.query.adminActionPlans.findFirst({
            columns: { status: true },
            where: { id: { eq: plan.id } },
        })
        if (latest?.status === 'applying')
            await database
                .update(schema.adminActionPlans)
                .set({ status: result.d1Applied ? 'partially_failed' : 'pending', result })
                .where(eq(schema.adminActionPlans.id, plan.id))
        throw error
    }
}

export const issueAdminUploadUrl = async (
    database: Database,
    actor: AdminActor,
    input: { key: string; contentType: string; size: number },
) => {
    const validated = adminUploadRequestSchema.parse(input)
    const key = normalizeAdminUploadKey(validated.key)
    const storage = getStorage()
    const [uploadInfo, publicUrl] = await Promise.all([
        storage.signedUploadUrl(key, {
            contentType: validated.contentType,
            expiresIn: 300,
        }),
        storage.url(key),
    ])
    const auditId = crypto.randomUUID()
    await database.insert(schema.adminAuditEvents).values({
        id: auditId,
        actorUserId: actor.userId,
        clientId: actor.clientId,
        source: 'mcp',
        action: 'issue_upload_url',
        resource: 'uploads',
        resourceId: key,
        before: null,
        after: {
            key,
            contentType: validated.contentType,
            requestedBytes: validated.size,
            maxBytes: MAX_ADMIN_UPLOAD_BYTES,
        },
        outcome: 'succeeded',
    })
    return {
        key,
        uploadInfo,
        publicUrl,
        expiresInSeconds: 300,
        maxBytes: MAX_ADMIN_UPLOAD_BYTES,
        auditId,
    }
}
