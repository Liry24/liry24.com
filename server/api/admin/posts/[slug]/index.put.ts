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

    const updatePost = db
        .update(schema.posts)
        .set({
            title,
            content,
        })
        .where(eq(schema.posts.slug, slug))

    const deleteTags = db.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug))
    if (tags?.length)
        await db.batch([
            updatePost,
            deleteTags,
            db.insert(schema.postTags).values(
                tags.map((tag) => ({
                    postSlug: slug,
                    tag,
                })),
            ),
        ])
    else await db.batch([updatePost, deleteTags])

    return {
        success: true,
    }
})
