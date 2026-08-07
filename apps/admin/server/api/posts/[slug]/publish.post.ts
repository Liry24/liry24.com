import z from 'zod'

const request = {
    params: z.object({
        slug: z.string().min(1),
    }),
}

export default adminSessionEventHandler(async ({ event, db }) => {
    const { slug } = await validateParams(request.params)
    await publishPost(db, slug, {
        publishWorkflow: getCloudflareEnvironment<{
            POST_PUBLISH_WORKFLOW: PostPublishWorkflow
        }>(event).POST_PUBLISH_WORKFLOW,
    })
    return { success: true, slug }
})
