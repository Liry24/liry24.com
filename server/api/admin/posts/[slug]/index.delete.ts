import { eq } from 'drizzle-orm'
import z from 'zod'

const request = {
    params: z.object({
        slug: z.string(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)

    await db.transaction(async (tx) => {
        await tx.delete(schema.postTags).where(eq(schema.postTags.postSlug, slug))
        await tx.delete(schema.posts).where(eq(schema.posts.slug, slug))
    })

    return {
        success: true,
    }
})
