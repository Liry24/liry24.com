export default eventHandler(async () => {
    const data = await db.query.careers.findMany()

    await defineCDNCache(60 * 60 * 24, 'careers')

    return data
})
