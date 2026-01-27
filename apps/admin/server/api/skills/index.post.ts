import { skills } from '@repo/database/schema'

const request = {
    body: skillsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { name, icon, category } = await validateBody(request.body)

    await db.insert(skills).values({
        name,
        icon,
        category,
    })

    await revalidateISR()

    return {
        success: true,
    }
})
