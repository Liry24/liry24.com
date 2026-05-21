import z from 'zod'

const request = {
    body: z.object({
        arts: artsInsertSchema.required({ slug: true }).array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { arts } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(schema.arts)

        for (const art of arts) {
            const [result] = await tx
                .insert(schema.arts)
                .values(art)
                .returning({ slug: schema.arts.slug })

            if (!result) return tx.rollback()

            await tx.insert(schema.artImages).values(
                art.images.map((image) => ({
                    artSlug: result.slug,
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
