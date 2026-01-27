import { arts } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    params: artsSelectSchema.pick({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)

    await db.delete(arts).where(eq(arts.slug, slug))

    await revalidateISR()

    return {
        success: true,
    }
})
