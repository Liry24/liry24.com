import z from 'zod'

import { getCloudflareEnvironment } from '../../../../utils/cloudflareContext'
import type { PostPublishWorkflow } from '../../../../utils/postService'

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
        publishWorkflow: getCloudflareEnvironment<{
            POST_PUBLISH_WORKFLOW: PostPublishWorkflow
        }>(event).POST_PUBLISH_WORKFLOW,
    })

    return {
        success: true,
    }
})
