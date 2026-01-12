import { eq } from 'drizzle-orm'
import { skills } from '~~/database/schema'

const request = {
    body: skillsUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id, name, icon, category } = await validateBody(request.body)

    await db
        .update(skills)
        .set({
            name,
            icon,
            category,
        })
        .where(eq(skills.id, id))

    await purgeVercelCDNCacheByTags('skills')

    return {
        success: true,
    }
})
