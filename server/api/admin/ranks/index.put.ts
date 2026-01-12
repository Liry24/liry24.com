import z from 'zod'
import { ranks as ranksTable } from '~~/database/schema'

const request = {
    body: z.object({
        ranks: ranksInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { ranks } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(ranksTable)
        await tx.insert(ranksTable).values(ranks)
    })

    await purgeVercelCDNCacheByTags('ranks')

    return {
        success: true,
    }
})
