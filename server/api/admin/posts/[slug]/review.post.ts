import z from 'zod'

import { getCloudflareEnvironment } from '../../../../utils/cloudflareContext'
import type { PostReviewQueue } from '../../../../utils/postService'

const request = {
    params: z.object({
        slug: z.string().min(1),
    }),
    body: z.object({
        title: z.string().min(1).max(500),
        excerpt: z.string().max(500),
        content: z.string().min(1).max(100_000),
    }),
}

export default adminSessionEventHandler(async ({ event }) => {
    const { slug } = await validateParams(request.params)
    const input = await validateBody(request.body)
    const jobId = await enqueuePostReview(
        db,
        slug,
        input,
        getCloudflareEnvironment<{ POST_REVIEW_QUEUE: PostReviewQueue }>(event).POST_REVIEW_QUEUE,
    )
    return { accepted: true, jobId }
})
