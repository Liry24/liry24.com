import z from 'zod'

const request = {
    body: z.object({
        ranks: ranksInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { ranks } = await validateBody(request.body)

    if (ranks.length)
        await db.batch([db.delete(schema.ranks), db.insert(schema.ranks).values(ranks)])
    else await db.delete(schema.ranks)

    return {
        success: true,
    }
})
