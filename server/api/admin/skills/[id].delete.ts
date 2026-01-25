import { eq } from 'drizzle-orm'
import { skills } from '~~/database/schema'

const request = {
    params: skillsSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(skills).where(eq(skills.id, id))

    await purgeVercelCDNCacheByTags('skills')

    return {
        success: true,
    }
})
