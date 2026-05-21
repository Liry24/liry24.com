import { socials } from '@repo/database/schema'

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

    await revalidateISR()
    await purgeRuntimeCache()

    return {
        success: true,
    }
})
