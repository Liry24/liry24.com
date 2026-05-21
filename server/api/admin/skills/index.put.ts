import { skills as skillsTable } from '@repo/database/schema'
import z from 'zod'

const request = {
    body: z.object({
        skills: skillsInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { skills } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(skillsTable)
        await tx.insert(skillsTable).values(skills)
    })

    await revalidateISR()

    return {
        success: true,
    }
})
