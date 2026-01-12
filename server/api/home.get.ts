export default eventHandler(async (event) => {
    const [socials, arts, careers, ranks, posts, works, skills] = await Promise.all([
        event.$fetch('/api/socials'),
        event.$fetch('/api/arts'),
        event.$fetch('/api/careers'),
        event.$fetch('/api/ranks'),
        event.$fetch('/api/posts'),
        event.$fetch('/api/works'),
        event.$fetch('/api/skills'),
    ])

    await defineCDNCache(60 * 60 * 24, 'home')

    return { socials, arts, careers, ranks, posts, works, skills }
})
