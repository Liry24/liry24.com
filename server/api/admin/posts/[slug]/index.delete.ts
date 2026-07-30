import { eq } from 'drizzle-orm'
import z from 'zod'

const request = {
    params: z.object({
        slug: z.string(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)

    await db.batch([
        db.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug)),
        db.delete(schema.posts).where(eq(schema.posts.slug, slug)),
    ])

    return {
        success: true,
    }
})
