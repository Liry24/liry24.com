import { generateText } from 'ai'
import z from 'zod'
import { createWorkersAI } from 'workers-ai-provider'
import { createPostSlug } from '../../../utils/postService'

const request = {
    body: z.object({ content: z.string().min(1).max(100_000) }),
}

const normalizeSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-+|-+$/gu, '')
        .slice(0, 80)

export default adminSessionEventHandler(async ({ event }) => {
    const { content } = await validateBody(request.body)
    const workersai = createWorkersAI({ binding: event.context.cloudflare.env.AI })
    const result = await generateText({
        model: workersai('@cf/google/gemini-3.1-flash-lite'),
        system:
            'You create blog metadata from Japanese Markdown. Return exactly one JSON object with an ASCII kebab-case "slug" (max 80 chars) and a Japanese "excerpt" (max 160 chars) suitable for a search result and OGP description. Do not include Markdown or commentary.',
        prompt: content,
    })
    const parsed = JSON.parse(result.text.trim().replace(/^```(?:json)?\s*|\s*```$/giu, '')) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw createError({ status: 502, statusText: 'Metadata generation returned an invalid response' })
    const metadata = parsed as Record<string, unknown>
    const slug = typeof metadata.slug === 'string' ? normalizeSlug(metadata.slug) : ''
    const excerpt = typeof metadata.excerpt === 'string' ? metadata.excerpt.trim().slice(0, 160) : ''
    if (!slug || !excerpt)
        throw createError({ status: 502, statusText: 'Metadata generation returned incomplete metadata' })
    return { slug: await createPostSlug(db, slug, slug), excerpt }
})
