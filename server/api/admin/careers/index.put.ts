import z from 'zod'

const request = {
    body: z.object({
        careers: careersInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { careers } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(schema.careers)
        await tx.insert(schema.careers).values(careers)
    })

    return {
        success: true,
    }
})
