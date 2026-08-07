import z from 'zod'

const request = {
    params: z.object({ slug: z.string().min(1), jobId: z.string().uuid() }),
}

export default adminSessionEventHandler(async ({ db }) => {
    const { slug, jobId } = await validateParams(request.params)
    const job = await db.query.postReviewJobs.findFirst({
        where: { id: { eq: jobId }, postSlug: { eq: slug } },
    })
    if (!job) throw createError({ status: 404, statusText: 'Review job not found' })
    const review = await db.query.postReviews.findFirst({
        where: { jobId: { eq: jobId } },
    })
    return { job, review: review ?? null }
})
