import { eq } from 'drizzle-orm'
import { socials } from '~~/database/schema'

const request = {
    body: socialsUpdateSchema.required({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id, href, alias, label, icon } = await validateBody(request.body)

    await db
        .update(socials)
        .set({
            href,
            alias,
            label,
            icon,
        })
        .where(eq(socials.id, id))

    await purgeVercelCDNCacheByTags('socials')

    return {
        success: true,
    }
})
