import { eq } from 'drizzle-orm'

const request = {
    params: artsSelectSchema.pick({ slug: true }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { slug } = await validateParams(request.params)

    await db.delete(schema.arts).where(eq(schema.arts.slug, slug))

    return {
        success: true,
    }
})
