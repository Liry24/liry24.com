export default eventHandler(async () => {
    const data = await db.query.socials.findMany()

    await defineCDNCache(60 * 60 * 24, 'socials')

    return data
})
