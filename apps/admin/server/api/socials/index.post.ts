const request = {
    body: socialsInsertSchema,
}

export default adminSessionEventHandler(async ({ db }) => {
    const { href, alias, label, icon } = await validateBody(request.body)

    await db.insert(schema.socials).values({
        href,
        alias,
        label,
        icon,
    })

    return {
        success: true,
    }
})
