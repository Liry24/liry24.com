export default eventHandler(async () => {
    const data = await db.query.works.findMany()

    await defineCDNCache(60 * 60 * 24, 'works')

    return data
})
