import { ranks } from '@repo/database/schema'

const request = {
    body: ranksInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { game, season, rank, href, imageUrl } = await validateBody(request.body)

    await db.insert(ranks).values({
        game,
        season,
        rank,
        href,
        imageUrl,
    })

    await revalidateISR()

    return {
        success: true,
    }
})
