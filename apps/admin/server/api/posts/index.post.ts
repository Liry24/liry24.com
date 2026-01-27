import { posts, postTags } from '@repo/database/schema'
import { generateText } from 'ai'

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

        const result = await generateText({
            model: 'google/gemini-3-flash',
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

    await db.transaction(async (tx) => {
        await tx.insert(posts).values({
            slug: slug || generatedSlug,
            title,
            content,
        })
        if (tags?.length)
            await tx.insert(postTags).values(
                tags.map((tag) => ({
                    postSlug: slug || generatedSlug,
                    tag,
                }))
            )
    })

    await revalidateISR()

    return {
        success: true,
        slug: slug || generatedSlug,
    }
})
