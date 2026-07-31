const request = {
    body: postsInsertSchema,
}

export default adminSessionEventHandler(async ({ session }) => {
    const input = await validateBody(request.body)
    const slug = await createPost(db, session.user.id, input)

    return {
        success: true,
        slug,
    }
})
