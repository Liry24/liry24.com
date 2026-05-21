import { artImages, arts } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    body: artsUpdateSchema.required({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug, title, description, href, images } = await validateBody(request.body)

    await db
        .update(arts)
        .set({
            slug,
            title,
            description,
            href,
        })
        .where(eq(arts.slug, slug))

    if (images?.length) {
        await db.delete(artImages).where(eq(artImages.artSlug, slug))

        for (const image of images)
            await db.insert(artImages).values({
                artSlug: slug,
                src: image.src,
                alt: image.alt,
            })
    }

    await revalidateISR()

    return {
        success: true,
    }
})
