export default eventHandler(async () => {
    const data = await db.query.socials.findMany()

    return data
})
