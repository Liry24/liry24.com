import { socials } from '@repo/database/schema'
import { eq } from 'drizzle-orm'

const request = {
    params: socialsSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(socials).where(eq(socials.id, id))

    await revalidateISR()
    await purgeRuntimeCache()

    return {
        success: true,
    }
})
