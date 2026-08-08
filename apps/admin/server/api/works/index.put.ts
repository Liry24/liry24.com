import { eq } from 'drizzle-orm'
import z from 'zod'

import { reorderRecords } from '../../utils/sortOrder'

const request = {
    body: z.object({
        order: worksSelectSchema.shape.slug.array(),
    }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { order } = await validateBody(request.body)
    const current = await db.select({ id: schema.works.slug }).from(schema.works)

    await reorderRecords({
        order,
        current: current.map(({ id }) => id),
        update: async (items) => {
            const statements = items.map(({ id, sortIndex }) =>
                db.update(schema.works).set({ sortIndex }).where(eq(schema.works.slug, id)),
            )
            if (statements[0]) await db.batch([statements[0], ...statements.slice(1)])
        },
    })

    return {
        success: true,
    }
})
