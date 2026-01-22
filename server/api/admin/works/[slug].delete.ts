import { eq } from 'drizzle-orm'
import { works } from '~~/database/schema'

const request = {
    params: worksSelectSchema.pick({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)

    await db.delete(works).where(eq(works.slug, slug))

    await purgeVercelCDNCacheByTags('works')

    return {
        success: true,
    }
})
