import z from 'zod'
import { artImages as artImagesTable, arts as artsTable } from '~~/database/schema'

const request = {
    body: z.object({
        arts: artsInsertSchema.required({ slug: true }).array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { arts } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(artsTable)

        for (const art of arts) {
            const [result] = await tx
                .insert(artsTable)
                .values(art)
                .returning({ slug: artsTable.slug })

            await tx.insert(artImagesTable).values(
                art.images.map((image) => ({
                    artSlug: result.slug,
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
