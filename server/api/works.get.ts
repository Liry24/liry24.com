export default eventHandler(async () => {
    const data = await db.query.works.findMany()

    return data
})
