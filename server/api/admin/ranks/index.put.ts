import z from 'zod'

const request = {
    body: z.object({
        ranks: ranksInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { ranks } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(schema.ranks)
        await tx.insert(schema.ranks).values(ranks)
    })

    return {
        success: true,
    }
})
