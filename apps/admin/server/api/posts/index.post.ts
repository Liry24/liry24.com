const request = {
    body: postsInsertSchema,
}

export default adminSessionEventHandler(async ({ event, session, db }) => {
    const input = await validateBody(request.body)
    const slug = await createPost(db, session.user.id, input, {
        publishWorkflow: getCloudflareEnvironment<{
            POST_PUBLISH_WORKFLOW: PostPublishWorkflow
        }>(event).POST_PUBLISH_WORKFLOW,
    })

    return {
        success: true,
        slug,
    }
})
