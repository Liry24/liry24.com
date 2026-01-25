import { eq } from 'drizzle-orm'
import { arts } from '~~/database/schema'

const request = {
    params: artsSelectSchema.pick({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)

    await db.delete(arts).where(eq(arts.slug, slug))

    await purgeVercelCDNCacheByTags('arts')

    return {
        success: true,
    }
})
