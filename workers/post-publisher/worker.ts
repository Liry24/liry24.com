import { WorkflowEntrypoint } from 'cloudflare:workers'

type Env = { DB: D1Database }
type PublishParams = { slug: string; scheduledAtMs: number; revision: string }

export class PublishPostWorkflow extends WorkflowEntrypoint<Env, PublishParams> {
    override async run(event: Readonly<WorkflowEvent<PublishParams>>, step: WorkflowStep) {
        await step.sleepUntil('wait-until-publication', event.payload.scheduledAtMs)
        return step.do('publish-scheduled-post', async () => {
            const now = Date.now()
            const result = await this.env.DB.prepare(
                `UPDATE posts
                 SET status = 'published', published_at = ?, scheduled_at = NULL,
                     schedule_revision = NULL, publish_workflow_instance_id = NULL,
                     publish_workflow_engine = NULL, updated_at = ?
                 WHERE slug = ? AND status = 'scheduled' AND scheduled_at = ? AND schedule_revision = ?`,
            )
                .bind(now, now, event.payload.slug, event.payload.scheduledAtMs, event.payload.revision)
                .run()
            return { published: result.meta.changes === 1 }
        })
    }
}

export default {
    fetch: () => new Response('Not found', { status: 404 }),
}
