import { eq } from 'drizzle-orm'

const request = {
    params: artsSelectSchema.required({ slug: true }),
    body: artsUpdateSchema,
}

export default adminSessionEventHandler(async ({ db }) => {
    const { slug: workSlug } = await validateParams(request.params)
    const { slug, href, title, description, images, sortIndex } = await validateBody(request.body)

    const updateArt = db
        .update(schema.arts)
        .set({
            slug,
            href,
            title,
            description,
            sortIndex,
        })
        .where(eq(schema.arts.slug, workSlug))

    if (images?.length)
        await db.batch([
            updateArt,
            db.delete(schema.artImages).where(eq(schema.artImages.artSlug, workSlug)),
            db.insert(schema.artImages).values(
                images.map((image) => ({
                    artSlug: slug || workSlug,
                    src: image.src,
                    alt: image.alt,
                })),
            ),
        ])
    else await updateArt

    return {
        success: true,
    }
})
