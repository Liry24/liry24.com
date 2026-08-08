export default adminSessionEventHandler(async ({ db }) => {
    const data = await db.query.ranks.findMany({
        orderBy: {
            sortIndex: 'asc',
        },
    })

    return data
})
