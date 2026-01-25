import { eq } from 'drizzle-orm'
import { ranks } from '~~/database/schema'

const request = {
    params: ranksSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(ranks).where(eq(ranks.id, id))

    await purgeVercelCDNCacheByTags('ranks')

    return {
        success: true,
    }
})
