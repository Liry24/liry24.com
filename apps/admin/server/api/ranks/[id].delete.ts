import { ranks } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    params: ranksSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(ranks).where(eq(ranks.id, id))

    await revalidateISR()

    return {
        success: true,
    }
})
