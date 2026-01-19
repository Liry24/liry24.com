import { socials } from '~~/database/schema'

const getSocials = defineCachedFunction(
    async () => {
        return await db
            .select({
                href: socials.href,
                alias: socials.alias,
            })
            .from(socials)
    },
    {
        maxAge: 60,
        name: 'social-redirects',
    }
)

export default eventHandler(async (event) => {
    let path = getRequestURL(event).pathname.slice(1)

    if (path.endsWith('/')) path = path.slice(0, -1)

    const socialsList = await getSocials()
    const social = socialsList.find((s) => s.alias === path)

    if (social?.href) return sendRedirect(event, social.href)
})
