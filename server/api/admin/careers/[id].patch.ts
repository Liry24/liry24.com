import { eq } from 'drizzle-orm'
import { careers } from '~~/database/schema'

const request = {
    params: careersSelectSchema.required({ id: true }),
    body: careersUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)
    const { period, position, company, sortIndex } = await validateBody(request.body)

    await db
        .update(careers)
        .set({
            period,
            position,
            company,
            sortIndex,
        })
        .where(eq(careers.id, id))

    await purgeVercelCDNCacheByTags('careers')

    return {
        success: true,
    }
})
