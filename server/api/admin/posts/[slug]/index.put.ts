import { eq } from 'drizzle-orm'
import z from 'zod'
import { posts, postTags } from '~~/database/schema'

const request = {
    params: z.object({
        slug: z.string(),
    }),
    body: postsUpdateSchema.omit({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)
    const { title, tags, content } = await validateBody(request.body)

    await db
        .update(posts)
        .set({
            title,
            content,
        })
        .where(eq(posts.slug, slug))

    await db.delete(postTags).where(eq(postTags.postSlug, slug))
    await db.insert(postTags).values(
        tags.map((tag) => ({
            postSlug: slug,
            tag,
        }))
    )

    await purgeVercelCDNCacheByTags(['posts', `posts-${slug}`])

    return {
        success: true,
    }
})
