import z from 'zod'
import { careers as careersTable } from '~~/database/schema'

const request = {
    body: z.object({
        careers: careersInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { careers } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(careersTable)
        await tx.insert(careersTable).values(careers)
    })

    await purgeVercelCDNCacheByTags('careers')

    return {
        success: true,
    }
})
