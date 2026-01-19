import { eq } from 'drizzle-orm'
import z from 'zod'
import { posts, postTags } from '~~/database/schema'

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

    await purgeVercelCDNCacheByTags(['posts', `posts-${slug}`])

    return {
        success: true,
    }
})
