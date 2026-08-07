import { eq } from 'drizzle-orm'

const request = {
    params: careersSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { id } = await validateParams(request.params)

    await db.delete(schema.careers).where(eq(schema.careers.id, id))

    return {
        success: true,
    }
})
