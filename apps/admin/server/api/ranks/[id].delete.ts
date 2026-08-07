import { eq } from 'drizzle-orm'

const request = {
    params: ranksSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { id } = await validateParams(request.params)

    await db.delete(schema.ranks).where(eq(schema.ranks.id, id))

    return {
        success: true,
    }
})
