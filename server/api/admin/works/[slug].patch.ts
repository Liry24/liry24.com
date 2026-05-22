import { eq } from 'drizzle-orm'

const request = {
    params: worksSelectSchema.required({ slug: true }),
    body: worksUpdateSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug: workSlug } = await validateParams(request.params)
    const { slug, href, title, description, category, image, icon, sortIndex } = await validateBody(
        request.body,
    )

    await db
        .update(schema.works)
        .set({
            slug,
            href,
            title,
            description,
            category,
            image,
            icon,
            sortIndex,
        })
        .where(eq(schema.works.slug, workSlug))

    return {
        success: true,
    }
})
