import z from 'zod'

const request = {
    body: z.object({
        works: worksInsertSchema.required({ slug: true }).omit({ sortIndex: true }).array(),
    }),
}

export default adminSessionEventHandler(async () => {
    const { works } = await validateBody(request.body)

    if (works.length)
        await db.batch([
            db.delete(schema.works),
            db.insert(schema.works).values(
                works.map((work, index) => ({
                    ...work,
                    createdAt: work.createdAt ? new Date(work.createdAt) : undefined,
                    sortIndex: index,
                })),
            ),
        ])
    else await db.delete(schema.works)

    return {
        success: true,
    }
})
