export default adminSessionEventHandler(async ({ db }) => {
    const data = await db.query.careers.findMany({
        orderBy: {
            sortIndex: 'asc',
        },
    })

    return data
})
