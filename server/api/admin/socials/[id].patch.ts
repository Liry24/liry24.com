import { eq } from 'drizzle-orm'

const request = {
    params: socialsSelectSchema.pick({ id: true }).required({ id: true }),
    body: socialsUpdateSchema.omit({ id: true }),
}

export default adminSessionEventHandler(async () => {
    const { id } = await validateParams(request.params)
    const { href, alias, icon, label, sortIndex } = await validateBody(request.body)

    await db
        .update(schema.socials)
        .set({
            href,
            alias,
            icon,
            label,
            sortIndex,
        })
        .where(eq(schema.socials.id, id))

    await purgeRuntimeCache()

    return {
        success: true,
    }
})
