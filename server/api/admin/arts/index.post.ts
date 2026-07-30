import { generateText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

const request = {
    body: artsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug, title, description, href, images } = await validateBody(request.body)

    let generatedSlug: string = ''

    const exists = await db.query.arts.findMany({
        columns: {
            slug: true,
        },
    })

    if (!slug) {
        const messages: { role: 'system' | 'user'; content: string }[] = []
        if (exists.length > 0)
            messages.push({
                role: 'system',
                content: `The short slug must not overlap with any of the existing slugs: ${exists.map((b) => b.slug).join(', ')}`,
            })

        const workersai = createWorkersAI({ binding: useEvent().context.cloudflare.env.AI })
        const result = await generateText({
            model: workersai('@cf/google/gemini-3.1-flash-lite'),
            messages: [
                ...messages,
                {
                    role: 'user',
                    content: `Create a short slug for the art with the title: ${title}`,
                },
            ],
            system: 'Please return only the slug as your answer.',
        })

        generatedSlug = result.text.trim()
    }

    const artSlug = slug || generatedSlug
    const insertArt = db.insert(schema.arts).values({
        slug: artSlug,
        title,
        description,
        href,
    })

    if (images.length)
        await db.batch([
            insertArt,
            db.insert(schema.artImages).values(
                images.map((image) => ({
                    artSlug,
                    src: image.src,
                    alt: image.alt,
                })),
            ),
        ])
    else await insertArt

    return {
        slug: artSlug,
    }
})
