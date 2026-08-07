const request = {
    body: postsInsertSchema,
}

export default adminSessionEventHandler(async ({ event, session }) => {
    const input = await validateBody(request.body)
    const slug = await createPost(db, session.user.id, input, {
        publishWorkflow: event.context.cloudflare.env.POST_PUBLISH_WORKFLOW,
    })

    return {
        success: true,
        slug,
    }
})
