import { createDB } from '../../database'
import type { D1Database, Message } from '@cloudflare/workers-types'
import { processPostReviewJob, type AiBinding } from '../utils/postService'

type ReviewMessage = { jobId?: unknown }

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('cloudflare:queue', async ({ batch, env }) => {
        if (batch.queue !== 'liry24-post-reviews') return

        const bindings = env as { DB: D1Database; AI: AiBinding }
        const database = createDB(bindings.DB)
        for (const message of batch.messages as readonly Message<ReviewMessage>[]) {
            const jobId = message.body?.jobId
            if (typeof jobId !== 'string') {
                message.ack()
                continue
            }
            const result = await processPostReviewJob(database, bindings.AI, jobId)
            if (result.outcome === 'retry') message.retry({ delaySeconds: result.delaySeconds })
            else if (result.outcome === 'missing' && message.attempts < 3)
                message.retry({ delaySeconds: 5 })
            else message.ack()
        }
    })
})
