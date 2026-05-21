import { careers } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    params: careersSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(careers).where(eq(careers.id, id))

    return {
        success: true,
    }
})
