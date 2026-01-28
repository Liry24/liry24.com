const getSocials = defineCachedFunction(
    async () =>
        await db.query.socials.findMany({
            columns: {
                href: true,
                alias: true,
            },
        }),
    {
        maxAge: 60 * 60 * 24 * 30,
        name: 'getSocials',
        getKey: () => 'default',
    }
)

export default eventHandler(async (event) => {
    let path = getRequestURL(event).pathname.slice(1)

    if (path.endsWith('/')) path = path.slice(0, -1)

    const socialsList = await getSocials()
    const social = socialsList.find((s) => s.alias === path)

    if (social?.href) return sendRedirect(event, social.href)
})
