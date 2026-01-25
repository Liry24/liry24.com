import { eq } from 'drizzle-orm'
import { artImages, arts } from '~~/database/schema'

const request = {
    params: artsSelectSchema.required({ slug: true }),
    body: artsUpdateSchema.required({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug: workSlug } = await validateParams(request.params)
    const { slug, href, title, description, images, sortIndex } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await db
            .update(arts)
            .set({
                slug,
                href,
                title,
                description,
                sortIndex,
            })
            .where(eq(arts.slug, workSlug))

        if (images?.length) {
            await tx.delete(artImages).where(eq(artImages.artSlug, workSlug))

            await tx.insert(artImages).values(
                images.map((image) => ({
                    artSlug: slug,
                    src: image.src,
                    alt: image.alt,
                }))
            )
        }
    })

    await purgeVercelCDNCacheByTags('arts')

    return {
        success: true,
    }
})
