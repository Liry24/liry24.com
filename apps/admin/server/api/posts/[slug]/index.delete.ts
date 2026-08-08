import z from 'zod'

const request = {
    params: z.object({
        slug: z.string(),
    }),
}

export default adminSessionEventHandler(async ({ event, db }) => {
    const { slug } = await validateParams(request.params)
    await deletePost(db, slug, {
        publishWorkflow: getCloudflareEnvironment<{
            POST_PUBLISH_WORKFLOW: PostPublishWorkflow
        }>(event).POST_PUBLISH_WORKFLOW,
    })

    return {
        success: true,
    }
})
