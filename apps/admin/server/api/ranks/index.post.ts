const request = {
    body: ranksInsertSchema,
}

export default adminSessionEventHandler(async ({ db }) => {
    const { game, season, rank, href, imageUrl } = await validateBody(request.body)

    await db.insert(schema.ranks).values({
        game,
        season,
        rank,
        href,
        imageUrl,
    })

    return {
        success: true,
    }
})
