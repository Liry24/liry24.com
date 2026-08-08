export default adminSessionEventHandler(async ({ db }) => {
    const data = await db.query.socials.findMany({
        orderBy: {
            sortIndex: 'asc',
        },
    })

    return data
})
