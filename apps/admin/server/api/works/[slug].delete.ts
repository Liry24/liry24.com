import { works } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    params: worksSelectSchema.pick({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)

    await db.delete(works).where(eq(works.slug, slug))

    await revalidateISR()

    return {
        success: true,
    }
})
