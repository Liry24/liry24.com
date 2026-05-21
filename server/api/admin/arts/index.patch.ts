import { eq } from 'drizzle-orm'

const request = {
    body: artsUpdateSchema.required({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug, title, description, href, images } = await validateBody(request.body)

    await db
        .update(schema.arts)
        .set({
            slug,
            title,
            description,
            href,
        })
        .where(eq(schema.arts.slug, slug))

    if (images?.length) {
        await db.delete(schema.artImages).where(eq(schema.artImages.artSlug, slug))

        for (const image of images)
            await db.insert(schema.artImages).values({
                artSlug: slug,
                src: image.src,
                alt: image.alt,
            })
    }

    return {
        success: true,
    }
})
