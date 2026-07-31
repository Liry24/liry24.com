import z from 'zod'

const request = {
    params: z.object({
        slug: z.string().min(1),
    }),
}

export default adminSessionEventHandler(async ({ event }) => {
    const { slug } = await validateParams(request.params)
    await publishPost(db, slug, {
        publishWorkflow: event.context.cloudflare.env.POST_PUBLISH_WORKFLOW,
    })
    return { success: true, slug }
})
