import { eq } from 'drizzle-orm'
import { ranks } from '~~/database/schema'

const request = {
    body: ranksUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id, href, game, season, rank, imageUrl } = await validateBody(request.body)

    await db
        .update(ranks)
        .set({
            href,
            game,
            season,
            rank,
            imageUrl,
        })
        .where(eq(ranks.id, id))

    await purgeVercelCDNCacheByTags('ranks')

    return {
        success: true,
    }
})
