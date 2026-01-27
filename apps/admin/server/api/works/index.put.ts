import { works as worksTable } from '@repo/database/schema'
import z from 'zod'

const request = {
    body: z.object({
        works: worksInsertSchema.required({ slug: true }).omit({ sortIndex: true }).array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { works } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(worksTable)
        await tx.insert(worksTable).values(
            works.map((work, index) => ({
                ...work,
                createdAt: work.createdAt ? new Date(work.createdAt) : undefined,
                sortIndex: index,
            }))
        )
    })

    await revalidateISR()

    return {
        success: true,
    }
})
