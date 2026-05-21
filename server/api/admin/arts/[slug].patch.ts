import { eq } from 'drizzle-orm'

const request = {
    params: artsSelectSchema.required({ slug: true }),
    body: artsUpdateSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug: workSlug } = await validateParams(request.params)
    const { slug, href, title, description, images, sortIndex } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await db
            .update(schema.arts)
            .set({
                slug,
                href,
                title,
                description,
                sortIndex,
            })
            .where(eq(schema.arts.slug, workSlug))

        if (images?.length) {
            await tx.delete(schema.artImages).where(eq(schema.artImages.artSlug, workSlug))

            await tx.insert(schema.artImages).values(
                images.map((image) => ({
                    artSlug: slug || workSlug,
                    src: image.src,
                    alt: image.alt,
                })),
            )
        }
    })

    return {
        success: true,
    }
})
