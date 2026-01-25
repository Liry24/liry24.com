import { eq } from 'drizzle-orm'
import { skills } from '~~/database/schema'

const request = {
    params: skillsSelectSchema.required({ id: true }),
    body: skillsUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)
    const { name, icon, category, sortIndex } = await validateBody(request.body)

    await db
        .update(skills)
        .set({
            name,
            icon,
            category,
            sortIndex,
        })
        .where(eq(skills.id, id))

    await purgeVercelCDNCacheByTags('skills')

    return {
        success: true,
    }
})
