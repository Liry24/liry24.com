import { generateText } from 'ai'
import { createWorkersAI, type WorkersAISettings } from 'workers-ai-provider'
import z from 'zod'

type WorkersAIBinding = Extract<WorkersAISettings, { binding: unknown }>['binding']

const request = {
    body: z.object({ content: z.string().min(1).max(100_000) }),
}

export default adminSessionEventHandler(async ({ event, db }) => {
    const { content } = await validateBody(request.body)
    const workersai = createWorkersAI({
        binding: getCloudflareEnvironment<{ AI: WorkersAIBinding }>(event).AI,
    })
    const result = await generateText({
        model: workersai('@cf/google/gemini-3.1-flash-lite'),
        system: 'You create blog metadata from Japanese Markdown. Return exactly one JSON object with an ASCII kebab-case "slug" (max 80 chars) and a Japanese "excerpt" (max 160 chars) suitable for a search result and OGP description. Do not include Markdown or commentary.',
        prompt: content,
    })
    const parsed = JSON.parse(
        result.text.trim().replace(/^```(?:json)?\s*|\s*```$/giu, ''),
    ) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw createError({
            status: 502,
            statusText: 'Metadata generation returned an invalid response',
        })
    const metadata = parsed as Record<string, unknown>
    const slug = typeof metadata.slug === 'string' ? normalizePostSlug(metadata.slug) : ''
    const excerpt =
        typeof metadata.excerpt === 'string' ? metadata.excerpt.trim().slice(0, 160) : ''
    if (!slug || !excerpt)
        throw createError({
            status: 502,
            statusText: 'Metadata generation returned incomplete metadata',
        })
    return { slug: await createPostSlug(db, slug, slug), excerpt }
})
