import { eq } from 'drizzle-orm'

const request = {
    params: careersSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(schema.careers).where(eq(schema.careers.id, id))

    return {
        success: true,
    }
})
