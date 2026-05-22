export default eventHandler(async () => {
    const data = await db.query.arts.findMany({
        with: {
            images: {
                columns: {
                    src: true,
                    alt: true,
                },
            },
        },
    })

    return data
})
