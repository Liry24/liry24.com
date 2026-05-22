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
        .update(schema.posts)
        .set({
            title,
            content,
        })
        .where(eq(schema.posts.slug, slug))

    await db.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug))
    if (tags) {
        await db.insert(schema.postTags).values(
            tags.map((tag) => ({
                postSlug: slug,
                tag,
            })),
        )
    }

    return {
        success: true,
    }
})
