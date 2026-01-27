import { posts, postTags } from '@repo/database/schema'
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
        await tx.delete(postTags).where(eq(postTags.postSlug, slug))
        await tx.delete(posts).where(eq(posts.slug, slug))
    })

    await revalidateISR()

    return {
        success: true,
    }
})
