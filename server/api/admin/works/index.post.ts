import { generateText } from 'ai'
import { sql } from 'drizzle-orm'
import { createWorkersAI, type WorkersAISettings } from 'workers-ai-provider'

import { getCloudflareEnvironment } from '../../../utils/cloudflareContext'

type WorkersAIBinding = Extract<WorkersAISettings, { binding: unknown }>['binding']

const request = {
    body: worksInsertSchema,
}

export default adminSessionEventHandler(async ({ event }) => {
    const { slug, title, description, category, image, icon, href, sortIndex } = await validateBody(
        request.body,
    )

    let generatedSlug: string = ''

    const exists = await db.query.works.findMany({
        columns: {
            slug: true,
        },
        limit: 32,
    })

    if (!slug) {
        const messages: { role: 'system' | 'user'; content: string }[] = []
        if (exists.length > 0)
            messages.push({
                role: 'system',
                content: `The short slug must not overlap with any of the existing slugs: ${exists.map((b) => b.slug).join(', ')}`,
            })

        const workersai = createWorkersAI({
            binding: getCloudflareEnvironment<{ AI: WorkersAIBinding }>(event).AI,
        })
        const result = await generateText({
            model: workersai('@cf/google/gemini-3.1-flash-lite'),
            messages: [
                ...messages,
                {
                    role: 'user',
                    content: `Create a short slug for the work with the title: ${title}`,
                },
            ],
            system: 'Please return only the slug as your answer.',
        })

        generatedSlug = result.text.trim()
    }

    await db.insert(schema.works).values({
        slug: slug || generatedSlug,
        title,
        description,
        category,
        image,
        icon,
        href,
        sortIndex: sortIndex || sql`coalesce(max(sortIndex), 0) + 1`,
    })

    return {
        success: true,
    }
})
