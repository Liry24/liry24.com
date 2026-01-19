import { socials } from '~~/database/schema'

const request = {
    body: socialsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { href, alias, label, icon } = await validateBody(request.body)

    await db.insert(socials).values({
        href,
        alias,
        label,
        icon,
    })

    await purgeVercelCDNCacheByTags('socials')

    return {
        success: true,
    }
})
