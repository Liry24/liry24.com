import { careers as careersTable } from '@repo/database/schema'
import z from 'zod'

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

    await revalidateISR()

    return {
        success: true,
    }
})
