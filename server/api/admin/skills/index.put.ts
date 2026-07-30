import z from 'zod'

const request = {
    body: z.object({
        skills: skillsInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { skills } = await validateBody(request.body)

    if (skills.length)
        await db.batch([db.delete(schema.skills), db.insert(schema.skills).values(skills)])
    else await db.delete(schema.skills)

    return {
        success: true,
    }
})
