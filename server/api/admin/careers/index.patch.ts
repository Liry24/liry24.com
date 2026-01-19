import { eq } from 'drizzle-orm'
import { careers } from '~~/database/schema'

const request = {
    body: careersUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id, period, position, company } = await validateBody(request.body)

    await db
        .update(careers)
        .set({
            period,
            position,
            company,
        })
        .where(eq(careers.id, id))

    await purgeVercelCDNCacheByTags('careers')

    return {
        success: true,
    }
})
