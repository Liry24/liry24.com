import type { D1Database } from '@cloudflare/workers-types'

import { createDB } from '../../../database'
import {
    processPostReviewJobs,
    publishScheduledPosts,
    type AiBinding,
} from '../../utils/postService'

type CloudflareTaskContext = {
    cloudflare?: {
        env?: {
            AI: AiBinding
            DB: D1Database
        }
    }
}

export default defineTask({
    meta: {
        name: 'posts:maintenance',
        description: 'Publishes scheduled posts and processes queued editorial reviews.',
    },
    async run({ context }) {
        const cloudflare = (context as CloudflareTaskContext).cloudflare
        if (!cloudflare?.env) throw new Error('Cloudflare task bindings are unavailable')

        const database = createDB(cloudflare.env.DB)
        const now = new Date()
        const [published, reviewed] = await Promise.all([
            publishScheduledPosts(database, now),
            processPostReviewJobs(database, cloudflare.env.AI, now),
        ])

        console.log(
            JSON.stringify({
                message: 'posts maintenance completed',
                published: published.length,
                reviewed,
            }),
        )

        return {
            result: {
                published: published.length,
                reviewed,
            },
        }
    },
})
