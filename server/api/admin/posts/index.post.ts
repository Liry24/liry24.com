import { generateText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

const request = {
    body: postsInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug, title, content, tags } = await validateBody(request.body)
    let generatedSlug: string = ''

    const exists = await db.query.posts.findMany({
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
                    content: `Create a short slug for the blog with the title: ${title}`,
                },
            ],
            system: 'Please return only the slug as your answer.',
        })

        generatedSlug = result.text.trim()
    }

    const postSlug = slug || generatedSlug
    const insertPost = db.insert(schema.posts).values({
        slug: postSlug,
        title,
        content,
    })

    if (tags?.length)
        await db.batch([
            insertPost,
            db.insert(schema.postTags).values(
                tags.map((tag) => ({
                    postSlug,
                    tag,
                })),
            ),
        ])
    else await insertPost

    return {
        success: true,
        slug: postSlug,
    }
})
