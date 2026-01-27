import { posts, postTags } from '@repo/database/schema'
import { eq } from 'drizzle-orm'
import z from 'zod'

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
    if (tags) {
        await db.insert(postTags).values(
            tags.map((tag) => ({
                postSlug: slug,
                tag,
            }))
        )
    }

    await revalidateISR()

    return {
        success: true,
    }
})
