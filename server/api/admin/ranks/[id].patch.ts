import { eq } from 'drizzle-orm'
import { ranks } from '~~/database/schema'

const request = {
    params: ranksSelectSchema.required({ id: true }),
    body: ranksUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)
    const { game, season, rank, imageUrl, href, sortIndex } = await validateBody(request.body)

    await db
        .update(ranks)
        .set({
            game,
            season,
            rank,
            imageUrl,
            href,
            sortIndex,
        })
        .where(eq(ranks.id, id))

    await purgeVercelCDNCacheByTags('ranks')

    return {
        success: true,
    }
})
