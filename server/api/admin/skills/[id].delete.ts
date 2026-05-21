import { skills } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    params: skillsSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(skills).where(eq(skills.id, id))

    return {
        success: true,
    }
})
