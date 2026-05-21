import { eq } from 'drizzle-orm'

const request = {
    params: skillsSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(schema.skills).where(eq(schema.skills.id, id))

    return {
        success: true,
    }
})
