const request = {
    body: skillsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { name, icon, category } = await validateBody(request.body)

    await db.insert(schema.skills).values({
        name,
        icon,
        category,
    })

    return {
        success: true,
    }
})
