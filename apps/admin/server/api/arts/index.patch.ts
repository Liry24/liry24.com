import { eq } from 'drizzle-orm'

const request = {
    body: artsUpdateSchema.required({ slug: true }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { slug, title, description, href, images } = await validateBody(request.body)

    const updateArt = db
        .update(schema.arts)
        .set({
            slug,
            title,
            description,
            href,
        })
        .where(eq(schema.arts.slug, slug))

    if (images?.length)
        await db.batch([
            updateArt,
            db.delete(schema.artImages).where(eq(schema.artImages.artSlug, slug)),
            db.insert(schema.artImages).values(
                images.map((image) => ({
                    artSlug: slug,
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
