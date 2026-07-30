import z from 'zod'

const request = {
    body: z.object({
        links: z.array(socialsInsertSchema),
    }),
}

export default adminSessionEventHandler(async () => {
    const { links } = await validateBody(request.body)

    if (links.length)
        await db.batch([db.delete(schema.socials), db.insert(schema.socials).values(links)])
    else await db.delete(schema.socials)

    return {
        success: true,
    }
})
