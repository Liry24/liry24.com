const request = {
    body: socialsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { href, alias, label, icon } = await validateBody(request.body)

    await db.insert(schema.socials).values({
        href,
        alias,
        label,
        icon,
    })

    await purgeRuntimeCache()

    return {
        success: true,
    }
})
