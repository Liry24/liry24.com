import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import type { ZodNumber, ZodString } from 'zod'
import { z } from 'zod'

import {
    artImages,
    arts,
    careers,
    postReviews,
    posts,
    postTags,
    ranks,
    skills,
    socials,
    works,
} from './schema'

export const socialsSelectSchema = createSelectSchema(socials, {
    id: z.coerce.number().int().positive(),
})
export const socialsInsertSchema = createInsertSchema(socials).omit({ id: true })
export const socialsUpdateSchema = createUpdateSchema(socials)
export type Social = z.infer<typeof socialsSelectSchema>

export const careersSelectSchema = createSelectSchema(careers, {
    id: z.coerce.number().int().positive(),
})
export const careersInsertSchema = createInsertSchema(careers).omit({ id: true })
export const careersUpdateSchema = createUpdateSchema(careers)
export type Career = z.infer<typeof careersSelectSchema>

export const artImagesSelectSchema = createSelectSchema(artImages).partial({
    id: true,
    artSlug: true,
    alt: true,
})
export const artImagesInsertSchema = createInsertSchema(artImages, {
    src: () => z.url(),
}).omit({ id: true })
export const artImagesUpdateSchema = createUpdateSchema(artImages, {
    src: () => z.url(),
}).omit({ id: true })
export type ArtImage = z.infer<typeof artImagesSelectSchema>

export const artsSelectSchema = createSelectSchema(arts).extend({
    images: artImagesSelectSchema
        .omit({
            artSlug: true,
        })
        .partial({
            id: true,
            alt: true,
        })
        .array(),
})
export const artsInsertSchema = createInsertSchema(arts, {
    slug: (s: ZodString) => s.optional(),
    title: (s: ZodString) => s.min(1),
}).extend({
    images: artImagesInsertSchema.omit({ artSlug: true }).array().min(1),
})
export const artsUpdateSchema = createUpdateSchema(arts, {
    slug: (s: ZodString) => s.optional(),
    title: (s: ZodString) => s.min(1),
}).extend({
    images: artImagesUpdateSchema
        .omit({ artSlug: true })
        .required({ src: true })
        .array()
        .optional(),
})
export type Art = z.infer<typeof artsSelectSchema>

export const worksSelectSchema = createSelectSchema(works, {
    createdAt: z.iso.datetime(),
})
export const worksInsertSchema = createInsertSchema(works, {
    slug: (s: ZodString) => s.optional(),
    createdAt: () => z.iso.datetime().optional(),
    title: (s: ZodString) => s.min(1),
    sortIndex: (s: ZodNumber) => s.optional(),
})
export const worksUpdateSchema = createUpdateSchema(works, {
    slug: (s: ZodString) => s.optional(),
    createdAt: () => z.iso.datetime().optional(),
    title: (s: ZodString) => s.min(1),
    sortIndex: (s: ZodNumber) => s.optional(),
})
export type Work = z.infer<typeof worksSelectSchema>

export const skillsSelectSchema = createSelectSchema(skills, {
    id: z.coerce.number().int().positive(),
})
export const skillsInsertSchema = createInsertSchema(skills).omit({ id: true })
export const skillsUpdateSchema = createUpdateSchema(skills)
export type Skill = z.infer<typeof skillsSelectSchema>

export const ranksSelectSchema = createSelectSchema(ranks, {
    id: z.coerce.number().int().positive(),
})
export const ranksInsertSchema = createInsertSchema(ranks).omit({ id: true })
export const ranksUpdateSchema = createUpdateSchema(ranks)
export type Rank = z.infer<typeof ranksSelectSchema>

export const postTagsSelectSchema = createSelectSchema(postTags)
export const postTagsInsertSchema = createInsertSchema(postTags, {
    tag: (s: ZodString) => s.min(1),
})
export const postTagsUpdateSchema = createUpdateSchema(postTags, {
    tag: (s: ZodString) => s.min(1),
})
export type PostTag = z.infer<typeof postTagsSelectSchema>

export const postStatusSchema = z.enum(['draft', 'scheduled', 'published'])
export const postReviewsSelectSchema = createSelectSchema(postReviews)
export type PostReview = z.infer<typeof postReviewsSelectSchema>

export const postsSelectSchema = createSelectSchema(posts).extend({
    tags: postTagsSelectSchema.omit({ postSlug: true }).array(),
    latestReview: postReviewsSelectSchema.nullable().optional(),
})
export const postsInsertSchema = createInsertSchema(posts, {
    slug: (s: ZodString) => s.optional(),
    title: (s: ZodString) => s.min(1, { error: 'Title is required' }),
    content: (s: ZodString) => s.min(1, { error: 'Content is required' }),
    excerpt: (s: ZodString) => s.max(500).optional(),
})
    .omit({
        authorUserId: true,
        publishedAt: true,
        scheduleRevision: true,
        publishWorkflowInstanceId: true,
        publishWorkflowEngine: true,
    })
    .extend({
        tags: z.string().min(1).array().optional(),
        status: z.enum(['draft', 'scheduled']).default('draft'),
        scheduledAt: z.coerce.date().nullable().optional(),
    })
export const postsUpdateSchema = createUpdateSchema(posts, {
    slug: (s: ZodString) => s.optional(),
    title: (s: ZodString) => s.min(1),
    content: (s: ZodString) => s.min(1),
    excerpt: (s: ZodString) => s.max(500).optional(),
})
    .omit({
        authorUserId: true,
        publishedAt: true,
        scheduleRevision: true,
        publishWorkflowInstanceId: true,
        publishWorkflowEngine: true,
    })
    .extend({
        tags: z.string().min(1).array().optional(),
        status: z.enum(['draft', 'scheduled']).optional(),
        scheduledAt: z.coerce.date().nullable().optional(),
    })
export type Post = z.infer<typeof postsSelectSchema>

export interface PublicSiteSnapshot {
    arts: Array<{
        slug: string
        title: string
        description: string | null
        href: string | null
        images: Array<{ src: string; alt: string | null }>
    }>
    careers: Array<{ period: string; position: string; company: string }>
    posts: Array<{
        slug: string
        createdAt: Date
        updatedAt: Date
        title: string
        excerpt: string
        content: string
        publishedAt: Date | null
        tags: Array<{ tag: string }>
    }>
    ranks: Array<{
        game: string
        season: string | null
        rank: string
        imageUrl: string
        href: string | null
    }>
    skills: Array<{ name: string; icon: string; category: string | null }>
    socials: Array<{ href: string; icon: string; label: string }>
    works: Array<{
        slug: string
        createdAt: Date
        title: string
        description: string | null
        category: string | null
        image: string | null
        icon: string | null
        href: string | null
        price: string | null
        style: 'large' | 'small'
    }>
}
