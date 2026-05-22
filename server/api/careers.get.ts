export default eventHandler(async () => {
    const data = await db.query.careers.findMany()

    return data
})
