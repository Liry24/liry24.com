import z from 'zod'
import { works as worksTable } from '~~/database/schema'

const request = {
    body: z.object({
        works: worksInsertSchema.required({ slug: true }).array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { works } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(worksTable)
        await tx.insert(worksTable).values(works)
    })

    await purgeVercelCDNCacheByTags('works')

    return {
        success: true,
    }
})
