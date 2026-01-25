import { eq } from 'drizzle-orm'
import { socials } from '~~/database/schema'

const request = {
    params: socialsSelectSchema.pick({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)

    await db.delete(socials).where(eq(socials.id, id))

    await purgeVercelCDNCacheByTags('socials')

    return {
        success: true,
    }
})
