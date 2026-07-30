export default eventHandler(async (event) => {
    if (event.method !== 'GET' && event.method !== 'HEAD') return

    let path = getRequestURL(event).pathname.slice(1)

    if (path.endsWith('/')) path = path.slice(0, -1)
    if (!path || path.includes('/')) return
    if (path.includes('.')) return
    if (['admin', 'api', 'arts', 'login', 'posts', 'works'].includes(path)) return

    const social = await db.query.socials.findFirst({
        columns: {
            href: true,
        },
        where: {
            alias: {
                eq: path,
            },
        },
    })

    if (social?.href) return sendRedirect(event, social.href)
})
