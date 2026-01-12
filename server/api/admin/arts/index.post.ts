import { artImages, arts } from '~~/database/schema'

const request = {
    body: artsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug, title, description, href, images } = await validateBody(request.body)

    let artSlug: string | undefined

    await db.transaction(async (tx) => {
        const [art] = await tx
            .insert(arts)
            .values({
                slug,
                title,
                description,
                href,
            })
            .returning({
                slug: arts.slug,
            })

        await tx.insert(artImages).values(
            images.map((image) => ({
                artSlug: art.slug,
                src: image.src,
                alt: image.alt,
            }))
        )

        artSlug = art.slug
    })

    await purgeVercelCDNCacheByTags('arts')

    return {
        slug: artSlug,
    }
})
