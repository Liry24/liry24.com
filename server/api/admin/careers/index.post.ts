const request = {
    body: careersInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { period, position, company } = await validateBody(request.body)

    await db.insert(schema.careers).values({
        period,
        position,
        company,
    })

    return {
        success: true,
    }
})
