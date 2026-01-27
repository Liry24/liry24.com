export default eventHandler(async () => {
    const data = await db.query.ranks.findMany()

    return data
})
