export default eventHandler(async () => {
    const data = await db.query.skills.findMany()

    return data
})
