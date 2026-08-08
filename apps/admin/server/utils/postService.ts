import type { Queue, Workflow } from '@cloudflare/workers-types'
import { schema, type Database } from '@repo/database'
import { and, eq, inArray } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'

export const LIRY24_AI_REVIEW_MODEL = 'openai/gpt-5.6-luna'

const REVIEW_RETRY_DELAYS_SECONDS = [60, 5 * 60, 30 * 60] as const

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

export type PostReviewQueue = Queue<{ jobId: string }>

export type ScheduledPublishParams = {
    slug: string
    scheduledAtMs: number
    revision: string
}

export type PostPublishWorkflow = Workflow<ScheduledPublishParams>

export type PostAutomation = {
    reviewQueue?: PostReviewQueue
    publishWorkflow?: PostPublishWorkflow
}

export const normalizePostSlug = (value: string) =>
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
    const base = normalizePostSlug(requested || title) || `post-${crypto.randomUUID().slice(0, 8)}`
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

export const createPublishWorkflow = async (
    automation: PostAutomation | undefined,
    slug: string,
    scheduledAt: Date,
) => {
    if (!automation?.publishWorkflow)
        throw new Error('Post publishing workflow binding is not configured')

    const revision = crypto.randomUUID()
    const instanceId = `post-publish-${revision}`
    const instance = await automation.publishWorkflow.create({
        id: instanceId,
        params: { slug, scheduledAtMs: scheduledAt.getTime(), revision },
    })
    return { revision, instanceId: instance.id }
}

const terminatePublishWorkflow = async (
    automation: PostAutomation | undefined,
    instanceId: string | null | undefined,
) => {
    if (!automation?.publishWorkflow || !instanceId) return
    try {
        const instance = await automation.publishWorkflow.get(instanceId)
        await instance.terminate()
    } catch (error) {
        // A completed or already terminated workflow is safe to leave alone.
        console.warn('Could not terminate superseded post publishing workflow', {
            instanceId,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

export const createPost = async (
    database: Database,
    actorUserId: string,
    input: PostDraftInput,
    automation?: PostAutomation,
) => {
    const status = input.status ?? 'draft'
    assertSchedule(status, input.scheduledAt)
    const slug = await createPostSlug(database, input.slug, input.title)
    const schedule =
        status === 'scheduled'
            ? await createPublishWorkflow(automation, slug, input.scheduledAt!)
            : null
    const tags = normalizedTags(input.tags)
    const statements: BatchItem<'sqlite'>[] = [
        database.insert(schema.posts).values({
            slug,
            title: input.title,
            excerpt: input.excerpt ?? '',
            content: input.content,
            status,
            scheduledAt: status === 'scheduled' ? input.scheduledAt : null,
            scheduleRevision: schedule?.revision ?? null,
            publishWorkflowInstanceId: schedule?.instanceId ?? null,
            publishWorkflowEngine: schedule ? 'workflow-v1' : null,
            publishedAt: null,
            authorUserId: actorUserId,
        }),
    ]
    if (tags.length)
        statements.push(
            database.insert(schema.postTags).values(tags.map((tag) => ({ postSlug: slug, tag }))),
        )
    await database.batch([statements[0]!, ...statements.slice(1)])
    return slug
}

export const updateUnpublishedPost = async (
    database: Database,
    slug: string,
    input: Partial<Omit<PostDraftInput, 'slug'>>,
    automation?: PostAutomation,
) => {
    const existing = await database.query.posts.findFirst({
        columns: {
            slug: true,
            title: true,
            excerpt: true,
            content: true,
            status: true,
            scheduledAt: true,
            scheduleRevision: true,
            publishWorkflowInstanceId: true,
        },
        where: { slug: { eq: slug } },
    })
    if (!existing) throw new Error('Post not found')
    if (existing.status === 'published') throw new Error('Published posts cannot be edited')
    const status = input.status ?? existing.status
    if (status !== 'draft' && status !== 'scheduled') throw new Error('Invalid post status')
    const scheduledAt = input.scheduledAt === undefined ? existing.scheduledAt : input.scheduledAt
    assertSchedule(status, scheduledAt)
    const replacesSchedule =
        status === 'scheduled' &&
        (!existing.scheduledAt ||
            existing.scheduledAt.getTime() !== scheduledAt!.getTime() ||
            !existing.publishWorkflowInstanceId)
    const schedule = replacesSchedule
        ? await createPublishWorkflow(automation, slug, scheduledAt!)
        : null
    const shouldClearSchedule = status === 'draft'
    const statements: BatchItem<'sqlite'>[] = [
        database
            .update(schema.posts)
            .set({
                title: input.title ?? existing.title,
                excerpt: input.excerpt ?? existing.excerpt,
                content: input.content ?? existing.content,
                status,
                scheduledAt: status === 'scheduled' ? scheduledAt : null,
                scheduleRevision:
                    schedule?.revision ?? (shouldClearSchedule ? null : existing.scheduleRevision),
                publishWorkflowInstanceId:
                    schedule?.instanceId ??
                    (shouldClearSchedule ? null : existing.publishWorkflowInstanceId),
                publishWorkflowEngine: schedule
                    ? 'workflow-v1'
                    : shouldClearSchedule
                      ? null
                      : 'workflow-v1',
            })
            .where(eq(schema.posts.slug, slug)),
    ]
    if (input.tags) {
        const tags = normalizedTags(input.tags)
        statements.push(database.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug)))
        if (tags.length)
            statements.push(
                database
                    .insert(schema.postTags)
                    .values(tags.map((tag) => ({ postSlug: slug, tag }))),
            )
    }
    await database.batch([statements[0]!, ...statements.slice(1)])
    if (replacesSchedule || shouldClearSchedule)
        await terminatePublishWorkflow(automation, existing.publishWorkflowInstanceId)
}

export const publishPost = async (
    database: Database,
    slug: string,
    automation?: PostAutomation,
    now = new Date(),
) => {
    const existing = await database.query.posts.findFirst({
        columns: { status: true, publishWorkflowInstanceId: true },
        where: { slug: { eq: slug } },
    })
    if (!existing) throw new Error('Post not found')
    const updated = await database
        .update(schema.posts)
        .set({
            status: 'published',
            publishedAt: now,
            scheduledAt: null,
            scheduleRevision: null,
            publishWorkflowInstanceId: null,
            publishWorkflowEngine: null,
        })
        .where(
            and(eq(schema.posts.slug, slug), inArray(schema.posts.status, ['draft', 'scheduled'])),
        )
        .returning({ slug: schema.posts.slug })
    if (updated.length)
        await terminatePublishWorkflow(automation, existing.publishWorkflowInstanceId)
}

export const deletePost = async (database: Database, slug: string, automation?: PostAutomation) => {
    const existing = await database.query.posts.findFirst({
        columns: { publishWorkflowInstanceId: true },
        where: { slug: { eq: slug } },
    })
    await database.batch([
        database.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug)),
        database.delete(schema.posts).where(eq(schema.posts.slug, slug)),
    ])
    await terminatePublishWorkflow(automation, existing?.publishWorkflowInstanceId)
}

export const enqueuePostReview = async (
    database: Database,
    postSlug: string,
    input: { title: string; excerpt: string; content: string },
    queue: PostReviewQueue | undefined,
) => {
    const post = await database.query.posts.findFirst({
        columns: { slug: true },
        where: { slug: { eq: postSlug } },
    })
    if (!post) throw new Error('Post not found')
    if (!queue) throw new Error('Post review queue binding is not configured')
    const id = crypto.randomUUID()
    // Sending first prevents a committed job from being stranded without a Queue message.
    await queue.send({ jobId: id })
    await database.insert(schema.postReviewJobs).values({
        id,
        postSlug,
        input,
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
                    'You are Liry24 editorial review. Review Japanese clarity, factual ambiguity, accessibility, legal-risk wording, and consistency. Output exactly one JSON object: {"summary":"current-content summary","issues":[{"severity":"low|medium|high","message":"..."}],"suggestedContent":"full revised markdown","notes":"short explanation of the proposed changes"}.',
            },
            { role: 'user', content: JSON.stringify(post) },
        ],
        temperature: 0.2,
        max_tokens: 4_000,
    })
    const parsed = JSON.parse(
        responseText(raw)
            .trim()
            .replace(/^```(?:json)?\s*|\s*```$/giu, ''),
    ) as unknown
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
        summary: typeof result.summary === 'string' ? result.summary.slice(0, 2_000) : '',
        suggestedContent:
            typeof result.suggestedContent === 'string' ? result.suggestedContent : null,
        notes: typeof result.notes === 'string' ? result.notes.slice(0, 4_000) : '',
    }
}

/** Process one Queue message. The caller decides ack/retry semantics. */
export const processPostReviewJob = async (database: Database, ai: AiBinding, jobId: string) => {
    const job = await database.query.postReviewJobs.findFirst({
        where: { id: { eq: jobId } },
    })
    if (!job) return { outcome: 'missing' as const }
    if (job.status === 'completed' || job.status === 'failed')
        return { outcome: 'complete' as const }

    const attempt = job.attempts + 1
    const claimed = await database
        .update(schema.postReviewJobs)
        .set({ status: 'running', attempts: attempt, lockedAt: new Date(), lastError: null })
        .where(
            and(eq(schema.postReviewJobs.id, job.id), eq(schema.postReviewJobs.status, 'pending')),
        )
        .returning({ id: schema.postReviewJobs.id })
    if (!claimed.length) return { outcome: 'complete' as const }

    try {
        const review = await runReviewAI(ai, job.input)
        await database.batch([
            database.insert(schema.postReviews).values({
                id: crypto.randomUUID(),
                jobId: job.id,
                postSlug: job.postSlug,
                model: LIRY24_AI_REVIEW_MODEL,
                status: 'completed',
                issues: review.issues,
                sourceContent: job.input.content,
                summary: review.summary,
                suggestedContent: review.suggestedContent,
                notes: review.notes,
                error: null,
            }),
            database
                .update(schema.postReviewJobs)
                .set({ status: 'completed', lockedAt: null, lastError: null })
                .where(eq(schema.postReviewJobs.id, job.id)),
        ])
        return { outcome: 'complete' as const }
    } catch (error) {
        const message = safeFailure(error)
        if (attempt > REVIEW_RETRY_DELAYS_SECONDS.length) {
            await database.batch([
                database.insert(schema.postReviews).values({
                    id: crypto.randomUUID(),
                    jobId: job.id,
                    postSlug: job.postSlug,
                    model: LIRY24_AI_REVIEW_MODEL,
                    status: 'failed',
                    issues: [],
                    sourceContent: job.input.content,
                    summary: '',
                    suggestedContent: null,
                    notes: '',
                    error: message,
                }),
                database
                    .update(schema.postReviewJobs)
                    .set({ status: 'failed', lockedAt: null, lastError: message })
                    .where(eq(schema.postReviewJobs.id, job.id)),
            ])
            return { outcome: 'complete' as const }
        }
        await database
            .update(schema.postReviewJobs)
            .set({ status: 'pending', lockedAt: null, lastError: message })
            .where(eq(schema.postReviewJobs.id, job.id))
        return {
            outcome: 'retry' as const,
            delaySeconds: REVIEW_RETRY_DELAYS_SECONDS[attempt - 1]!,
        }
    }
}
