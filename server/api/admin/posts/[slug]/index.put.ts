import z from 'zod'

const request = {
    params: z.object({
        slug: z.string(),
    }),
    body: postsUpdateSchema.omit({ slug: true }),
}

export default adminSessionEventHandler(async ({ event }) => {
    const { slug } = await validateParams(request.params)
    const input = await validateBody(request.body)
    await updateUnpublishedPost(db, slug, input, {
        publishWorkflow: event.context.cloudflare.env.POST_PUBLISH_WORKFLOW,
    })

    return {
        success: true,
    }
})
