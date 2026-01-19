import z from 'zod'
import { socials } from '~~/database/schema'

const request = {
    body: z.object({
        links: z.array(socialsInsertSchema),
    }),
}

export default adminSessionEventHandler(async () => {
    const { links } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(socials)
        await tx.insert(socials).values(links)
    })

    await purgeVercelCDNCacheByTags('socials')

    return {
        success: true,
    }
})
