import { eq } from 'drizzle-orm'
import z from 'zod'

import { reorderRecords } from '../../utils/sortOrder'

const request = {
    body: z.object({
        order: careersSelectSchema.shape.id.array(),
    }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { order } = await validateBody(request.body)
    const current = await db.select({ id: schema.careers.id }).from(schema.careers)

    await reorderRecords({
        order,
        current: current.map(({ id }) => id),
        update: async (items) => {
            const statements = items.map(({ id, sortIndex }) =>
                db.update(schema.careers).set({ sortIndex }).where(eq(schema.careers.id, id)),
            )
            if (statements[0]) await db.batch([statements[0], ...statements.slice(1)])
        },
    })

    return {
        success: true,
    }
})
