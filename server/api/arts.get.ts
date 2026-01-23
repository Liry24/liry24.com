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

    await defineCDNCache(60 * 60 * 24, 'arts')

    return data
})
