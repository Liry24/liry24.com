import { eq } from 'drizzle-orm'

const request = {
    params: socialsSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { id } = await validateParams(request.params)

    await db.delete(schema.socials).where(eq(schema.socials.id, id))

    return {
        success: true,
    }
})
