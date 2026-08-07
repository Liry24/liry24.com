export default adminSessionEventHandler(async ({ db }) => {
    const data = await db.query.skills.findMany({
        orderBy: {
            sortIndex: 'asc',
        },
    })

    return data
})
