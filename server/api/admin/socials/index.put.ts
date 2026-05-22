import z from 'zod'

const request = {
    body: z.object({
        links: z.array(socialsInsertSchema),
    }),
}

export default adminSessionEventHandler(async () => {
    const { links } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(schema.socials)
        await tx.insert(schema.socials).values(links)
    })

    await purgeRuntimeCache()

    return {
        success: true,
    }
})
