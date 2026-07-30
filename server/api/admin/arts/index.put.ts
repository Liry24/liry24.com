import z from 'zod'

const request = {
    body: z.object({
        arts: artsInsertSchema.required({ slug: true }).array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { arts } = await validateBody(request.body)

    const deleteArts = db.delete(schema.arts)
    if (arts.length === 0) await deleteArts
    else {
        const images = arts.flatMap((art) =>
            art.images.map((image) => ({
                artSlug: art.slug,
                src: image.src,
                alt: image.alt,
            })),
        )
        const insertArts = db
            .insert(schema.arts)
            .values(arts.map(({ images: _images, ...art }) => art))

        if (images.length)
            await db.batch([deleteArts, insertArts, db.insert(schema.artImages).values(images)])
        else await db.batch([deleteArts, insertArts])
    }

    return {
        success: true,
    }
})
