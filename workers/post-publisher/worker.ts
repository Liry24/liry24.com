import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers'

type Env = Cloudflare.Env & { SITE_DEPLOY_HOOK_URL?: string }
type PublishParams = { slug: string; scheduledAtMs: number; revision: string }

export class PublishPostWorkflow extends WorkflowEntrypoint<Env, PublishParams> {
    override async run(event: Readonly<WorkflowEvent<PublishParams>>, step: WorkflowStep) {
        await step.sleepUntil('wait-until-publication', event.payload.scheduledAtMs)
        const publication = await step.do('publish-scheduled-post', async () => {
            const now = Date.now()
            const result = await this.env.DB.prepare(
                `UPDATE posts
                 SET status = 'published', published_at = ?, scheduled_at = NULL,
                     schedule_revision = NULL, publish_workflow_instance_id = NULL,
                     publish_workflow_engine = NULL, updated_at = ?
                 WHERE slug = ? AND status = 'scheduled' AND scheduled_at = ? AND schedule_revision = ?`,
            )
                .bind(
                    now,
                    now,
                    event.payload.slug,
                    event.payload.scheduledAtMs,
                    event.payload.revision,
                )
                .run()
            return { published: result.meta.changes === 1 }
        })

        if (publication.published)
            await step.do('request-site-build', async () => {
                if (!this.env.SITE_DEPLOY_HOOK_URL)
                    throw new Error('SITE_DEPLOY_HOOK_URL is not configured')

                const response = await fetch(this.env.SITE_DEPLOY_HOOK_URL, { method: 'POST' })
                if (!response.ok) throw new Error(`Site build hook failed with ${response.status}`)

                return { status: response.status }
            })

        return publication
    }
}

export default {
    fetch: () => new Response('Not found', { status: 404 }),
}
