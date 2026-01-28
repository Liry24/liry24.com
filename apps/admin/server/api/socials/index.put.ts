import { socials } from '@repo/database/schema'
import z from 'zod'

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

    await revalidateISR()
    await purgeRuntimeCache()

    return {
        success: true,
    }
})
