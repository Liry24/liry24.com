import { and, eq, inArray, isNull, lte, or } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'

import { schema, type Database } from '../../database'

export const LIRY24_AI_REVIEW_MODEL = 'openai/gpt-5.6-luna'

const REVIEW_RETRY_DELAYS = [60_000, 5 * 60_000, 30 * 60_000] as const
const REVIEW_LEASE_MS = 5 * 60_000

export type PostDraftInput = {
    slug?: string
    title: string
    excerpt?: string
    content: string
    tags?: string[]
    status?: 'draft' | 'scheduled'
    scheduledAt?: Date | null
}

export type AiBinding = {
    run(model: string, inputs: Record<string, unknown>): Promise<unknown>
}

const normalizeSlug = (value: string) =>
    value
        .normalize('NFKD')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-+|-+$/gu, '')
        .slice(0, 80)

export const createPostSlug = async (
    database: Database,
    requested: string | undefined,
    title: string,
) => {
    const base = normalizeSlug(requested || title) || `post-${crypto.randomUUID().slice(0, 8)}`
    const existing = await database.query.posts.findMany({
        columns: { slug: true },
        where: { slug: { like: `${base}%` } },
        limit: 100,
    })
    const used = new Set(existing.map((post) => post.slug))
    if (!used.has(base)) return base
    for (let suffix = 2; suffix <= 100; suffix += 1) {
        const candidate = `${base}-${suffix}`
        if (!used.has(candidate)) return candidate
    }
    return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

const normalizedTags = (tags: string[] | undefined) =>
    [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))].slice(0, 20)

const assertSchedule = (status: 'draft' | 'scheduled', scheduledAt?: Date | null) => {
    if (status === 'scheduled' && (!scheduledAt || scheduledAt.getTime() <= Date.now()))
        throw new Error('scheduledAt must be a future date for a scheduled post')
}

export const createPost = async (
    database: Database,
    actorUserId: string,
    input: PostDraftInput,
) => {
    const status = input.status ?? 'draft'
    assertSchedule(status, input.scheduledAt)
    const slug = await createPostSlug(database, input.slug, input.title)
    const tags = normalizedTags(input.tags)
    const statements: BatchItem<'sqlite'>[] = [
        database.insert(schema.posts).values({
            slug,
            title: input.title,
            excerpt: input.excerpt ?? '',
            content: input.content,
            status,
            scheduledAt: status === 'scheduled' ? input.scheduledAt : null,
            publishedAt: null,
            authorUserId: actorUserId,
        }),
    ]
    if (tags.length)
        statements.push(
            database.insert(schema.postTags).values(
                tags.map((tag) => ({
                    postSlug: slug,
                    tag,
                })),
            ),
        )
    await database.batch([statements[0]!, ...statements.slice(1)])
    return slug
}

export const updateUnpublishedPost = async (
    database: Database,
    slug: string,
    input: Partial<Omit<PostDraftInput, 'slug'>>,
) => {
    const existing = await database.query.posts.findFirst({
        columns: {
            slug: true,
            title: true,
            excerpt: true,
            content: true,
            status: true,
            scheduledAt: true,
        },
        where: { slug: { eq: slug } },
    })
    if (!existing) throw new Error('Post not found')
    if (existing.status === 'published') throw new Error('Published posts cannot be edited')
    const status = input.status ?? existing.status
    if (status !== 'draft' && status !== 'scheduled') throw new Error('Invalid post status')
    const scheduledAt = input.scheduledAt === undefined ? existing.scheduledAt : input.scheduledAt
    assertSchedule(status, scheduledAt)
    const statements: BatchItem<'sqlite'>[] = [
        database
            .update(schema.posts)
            .set({
                title: input.title ?? existing.title,
                excerpt: input.excerpt ?? existing.excerpt,
                content: input.content ?? existing.content,
                status,
                scheduledAt: status === 'scheduled' ? scheduledAt : null,
            })
            .where(eq(schema.posts.slug, slug)),
    ]
    if (input.tags) {
        const tags = normalizedTags(input.tags)
        statements.push(database.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug)))
        if (tags.length)
            statements.push(
                database.insert(schema.postTags).values(
                    tags.map((tag) => ({
                        postSlug: slug,
                        tag,
                    })),
                ),
            )
    }
    await database.batch([statements[0]!, ...statements.slice(1)])
}

export const publishPost = async (database: Database, slug: string, now = new Date()) => {
    const updated = await database
        .update(schema.posts)
        .set({
            status: 'published',
            publishedAt: now,
            scheduledAt: null,
        })
        .where(
            and(eq(schema.posts.slug, slug), inArray(schema.posts.status, ['draft', 'scheduled'])),
        )
        .returning({ slug: schema.posts.slug })
    if (!updated.length) {
        const existing = await database.query.posts.findFirst({
            columns: { status: true },
            where: { slug: { eq: slug } },
        })
        if (!existing) throw new Error('Post not found')
    }
}

export const enqueuePostReview = async (database: Database, postSlug: string) => {
    const post = await database.query.posts.findFirst({
        columns: { slug: true },
        where: { slug: { eq: postSlug } },
    })
    if (!post) throw new Error('Post not found')
    const id = crypto.randomUUID()
    await database.insert(schema.postReviewJobs).values({
        id,
        postSlug,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
    })
    return id
}

const safeFailure = (error: unknown) =>
    (error instanceof Error ? `${error.name}: ${error.message}` : 'AI request failed')
        .replace(/https?:\/\/\S+/giu, '[url]')
        .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/giu, '[email]')
        .slice(0, 1_000)

const responseText = (value: unknown) => {
    if (typeof value === 'string') return value
    if (!value || typeof value !== 'object') return ''
    const record = value as {
        response?: unknown
        choices?: Array<{ message?: { content?: unknown } }>
    }
    if (typeof record.response === 'string') return record.response
    const content = record.choices?.[0]?.message?.content
    return typeof content === 'string' ? content : ''
}

const runReviewAI = async (
    ai: AiBinding,
    post: { title: string; excerpt: string; content: string },
) => {
    const raw = await ai.run(LIRY24_AI_REVIEW_MODEL, {
        messages: [
            {
                role: 'system',
                content:
                    'You are Liry24 editorial review. Check Japanese clarity, factual ambiguity, accessibility, legal-risk wording, and consistency. Output {"issues":[{"severity":"low|medium|high","message":"..."}],"suggestedContent":"..."}. Return one JSON object only.',
            },
            {
                role: 'user',
                content: JSON.stringify(post),
            },
        ],
        temperature: 0.2,
        max_tokens: 4_000,
    })
    const text = responseText(raw)
        .trim()
        .replace(/^```(?:json)?\s*|\s*```$/giu, '')
    const parsed = JSON.parse(text) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('AI response was not a JSON object')
    const result = parsed as Record<string, unknown>
    const issues = Array.isArray(result.issues)
        ? result.issues.flatMap((issue) => {
              if (!issue || typeof issue !== 'object' || Array.isArray(issue)) return []
              const item = issue as Record<string, unknown>
              const severity = String(item.severity)
              if (!['low', 'medium', 'high'].includes(severity) || typeof item.message !== 'string')
                  return []
              return [
                  {
                      severity: severity as 'low' | 'medium' | 'high',
                      message: item.message.slice(0, 1_000),
                  },
              ]
          })
        : []
    return {
        issues,
        suggestedContent:
            typeof result.suggestedContent === 'string' ? result.suggestedContent : null,
    }
}

export const processPostReviewJobs = async (
    database: Database,
    ai: AiBinding,
    now = new Date(),
    limit = 5,
) => {
    const staleLease = new Date(now.getTime() - REVIEW_LEASE_MS)
    const jobs = await database.query.postReviewJobs.findMany({
        where: {
            OR: [
                {
                    status: { eq: 'pending' },
                    availableAt: { lte: now },
                },
                {
                    status: { eq: 'running' },
                    lockedAt: { lte: staleLease },
                },
            ],
        },
        orderBy: { availableAt: 'asc' },
        limit,
    })

    for (const job of jobs) {
        const claimed = await database
            .update(schema.postReviewJobs)
            .set({ status: 'running', lockedAt: now })
            .where(
                and(
                    eq(schema.postReviewJobs.id, job.id),
                    or(
                        eq(schema.postReviewJobs.status, 'pending'),
                        and(
                            eq(schema.postReviewJobs.status, 'running'),
                            lte(schema.postReviewJobs.lockedAt, staleLease),
                        ),
                    ),
                ),
            )
            .returning({ id: schema.postReviewJobs.id })
        if (!claimed.length) continue

        const attempt = job.attempts + 1
        try {
            const post = await database.query.posts.findFirst({
                columns: { title: true, excerpt: true, content: true },
                where: { slug: { eq: job.postSlug } },
            })
            if (!post) throw new Error('Post not found')
            const review = await runReviewAI(ai, post)
            await database.batch([
                database.insert(schema.postReviews).values({
                    id: crypto.randomUUID(),
                    postSlug: job.postSlug,
                    model: LIRY24_AI_REVIEW_MODEL,
                    status: 'completed',
                    issues: review.issues,
                    suggestedContent: review.suggestedContent,
                    error: null,
                }),
                database
                    .update(schema.postReviewJobs)
                    .set({
                        status: 'completed',
                        attempts: attempt,
                        lockedAt: null,
                        lastError: null,
                    })
                    .where(eq(schema.postReviewJobs.id, job.id)),
            ])
        } catch (error) {
            const message = safeFailure(error)
            if (attempt >= REVIEW_RETRY_DELAYS.length) {
                await database.batch([
                    database.insert(schema.postReviews).values({
                        id: crypto.randomUUID(),
                        postSlug: job.postSlug,
                        model: LIRY24_AI_REVIEW_MODEL,
                        status: 'failed',
                        issues: [],
                        suggestedContent: null,
                        error: message,
                    }),
                    database
                        .update(schema.postReviewJobs)
                        .set({
                            status: 'failed',
                            attempts: attempt,
                            lockedAt: null,
                            lastError: message,
                        })
                        .where(eq(schema.postReviewJobs.id, job.id)),
                ])
            } else {
                await database
                    .update(schema.postReviewJobs)
                    .set({
                        status: 'pending',
                        attempts: attempt,
                        availableAt: new Date(now.getTime() + REVIEW_RETRY_DELAYS[attempt - 1]!),
                        lockedAt: null,
                        lastError: message,
                    })
                    .where(eq(schema.postReviewJobs.id, job.id))
            }
        }
    }

    return jobs.length
}

export const publishScheduledPosts = async (database: Database, now = new Date()) =>
    database
        .update(schema.posts)
        .set({
            status: 'published',
            publishedAt: now,
            scheduledAt: null,
        })
        .where(
            and(
                eq(schema.posts.status, 'scheduled'),
                lte(schema.posts.scheduledAt, now),
                or(isNull(schema.posts.publishedAt), lte(schema.posts.publishedAt, now)),
            ),
        )
        .returning({ slug: schema.posts.slug })
