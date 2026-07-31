import z from 'zod'

const request = {
    params: z.object({
        slug: z.string().min(1),
    }),
}

export default adminSessionEventHandler(async ({ event }) => {
    const { slug } = await validateParams(request.params)
    const jobId = await enqueuePostReview(db, slug)
    event.context.cloudflare.context.waitUntil(
        processPostReviewJobs(db, event.context.cloudflare.env.AI).catch((error) => {
            console.error(
                JSON.stringify({
                    message: 'post review background processing failed',
                    jobId,
                    error: error instanceof Error ? error.message : String(error),
                }),
            )
        }),
    )
    return { accepted: true, jobId }
})
