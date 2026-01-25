import { eq } from 'drizzle-orm'
import { socials } from '~~/database/schema'

const request = {
    params: socialsSelectSchema.required({ id: true }),
    body: socialsUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)
    const { href, alias, icon, label, sortIndex } = await validateBody(request.body)

    await db
        .update(socials)
        .set({
            href,
            alias,
            icon,
            label,
            sortIndex,
        })
        .where(eq(socials.id, id))

    await purgeVercelCDNCacheByTags('socials')

    return {
        success: true,
    }
})
