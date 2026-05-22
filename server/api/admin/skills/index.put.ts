import z from 'zod'

const request = {
    body: z.object({
        skills: skillsInsertSchema.array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { skills } = await validateBody(request.body)

    await db.transaction(async (tx) => {
        await tx.delete(schema.skills)
        await tx.insert(schema.skills).values(skills)
    })

    return {
        success: true,
    }
})
