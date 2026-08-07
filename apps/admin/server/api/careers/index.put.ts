import z from 'zod'

const request = {
    body: z.object({
        careers: careersInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { careers } = await validateBody(request.body)

    if (careers.length)
        await db.batch([db.delete(schema.careers), db.insert(schema.careers).values(careers)])
    else await db.delete(schema.careers)

    return {
        success: true,
    }
})
