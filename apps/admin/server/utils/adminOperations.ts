import { z } from 'zod'

export const contentResourceSchema = z.enum([
    'posts',
    'works',
    'arts',
    'socials',
    'skills',
    'careers',
    'ranks',
])

export const queryResourceSchema = z.enum([
    ...contentResourceSchema.options,
    'users',
    'post_reviews',
    'audit_events',
])

const resourceIdSchema = z.union([z.string().min(1).max(160), z.number().int().positive()])
const dataSchema = z.record(z.string(), z.unknown())

export const adminOperationSchema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('create'),
        resource: contentResourceSchema,
        data: dataSchema,
    }),
    z.object({
        action: z.literal('update'),
        resource: contentResourceSchema,
        id: resourceIdSchema,
        data: dataSchema,
    }),
    z.object({
        action: z.literal('delete'),
        resource: contentResourceSchema,
        id: resourceIdSchema,
    }),
    z.object({
        action: z.literal('reorder'),
        resource: z.enum(['works', 'arts', 'socials', 'skills', 'careers', 'ranks']),
        ids: resourceIdSchema.array().min(1).max(50),
    }),
    z.object({
        action: z.literal('schedule_post'),
        resource: z.literal('posts').default('posts'),
        id: z.string().min(1).max(160),
        scheduledAt: z.iso.datetime(),
    }),
    z.object({
        action: z.literal('publish_post'),
        resource: z.literal('posts').default('posts'),
        id: z.string().min(1).max(160),
    }),
    z.object({
        action: z.literal('request_post_review'),
        resource: z.literal('posts').default('posts'),
        id: z.string().min(1).max(160),
    }),
    z.object({
        action: z.literal('set_user_role'),
        resource: z.literal('users').default('users'),
        id: z.string().min(1).max(160),
        role: z.enum(['admin', 'user']),
    }),
    z.object({
        action: z.literal('ban_user'),
        resource: z.literal('users').default('users'),
        id: z.string().min(1).max(160),
        reason: z.string().min(1).max(500),
        expiresInSeconds: z
            .number()
            .int()
            .positive()
            .max(365 * 24 * 60 * 60)
            .optional(),
    }),
    z.object({
        action: z.literal('unban_user'),
        resource: z.literal('users').default('users'),
        id: z.string().min(1).max(160),
    }),
    z.object({
        action: z.literal('revoke_user_sessions'),
        resource: z.literal('users').default('users'),
        id: z.string().min(1).max(160),
    }),
    z.object({
        action: z.literal('import_upload_url'),
        resource: z.literal('uploads').default('uploads'),
        sourceUrl: z.url(),
        key: z.string().min(1).max(512),
    }),
])

export const adminQueryInputSchema = z.object({
    resource: queryResourceSchema,
    id: resourceIdSchema.optional(),
    search: z.string().trim().max(200).optional(),
    status: z.enum(['draft', 'scheduled', 'published', 'completed', 'failed']).optional(),
    cursor: z.string().max(32).optional(),
    limit: z.number().int().min(1).max(50).default(25),
})

export const adminPrepareInputSchema = z.object({
    operations: adminOperationSchema.array().min(1).max(50),
})

export const adminApplyInputSchema = z.object({
    planId: z.uuid(),
})

export const adminIssueUploadInputSchema = z.object({
    key: z.string().min(1).max(512),
    contentType: z.string().min(1).max(100),
    size: z.number().int().positive(),
})

export type AdminOperation = z.infer<typeof adminOperationSchema>
export type ContentResource = z.infer<typeof contentResourceSchema>
export type QueryResource = z.infer<typeof queryResourceSchema>
