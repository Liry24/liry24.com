export default eventHandler(async () => {
    const data = await db.query.skills.findMany()

    await defineCDNCache(60 * 60 * 24, 'skills')

    return data
})
