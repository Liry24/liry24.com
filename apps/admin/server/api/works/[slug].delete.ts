import { eq } from 'drizzle-orm'

const request = {
    params: worksSelectSchema.pick({ slug: true }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { slug } = await validateParams(request.params)

    await db.delete(schema.works).where(eq(schema.works.slug, slug))

    return {
        success: true,
    }
})
