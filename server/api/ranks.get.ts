export default eventHandler(async () => {
    const data = await db.query.ranks.findMany()

    await defineCDNCache(60 * 60 * 24, 'ranks')

    return data
})
