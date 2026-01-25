import { eq } from 'drizzle-orm'
import { careers } from '~~/database/schema'

const request = {
    params: careersSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(careers).where(eq(careers.id, id))

    await purgeVercelCDNCacheByTags('careers')

    return {
        success: true,
    }
})
