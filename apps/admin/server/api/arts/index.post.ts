import { artImages, arts } from '@repo/database/schema'
import { generateText } from 'ai'

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

        const result = await generateText({
            model: 'google/gemini-3-flash',
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

    await db.transaction(async (tx) => {
        await tx.insert(arts).values({
            slug: slug || generatedSlug,
            title,
            description,
            href,
        })

        await tx.insert(artImages).values(
            images.map((image) => ({
                artSlug: slug || generatedSlug,
                src: image.src,
                alt: image.alt,
            }))
        )
    })

    await revalidateISR()

    return {
        slug: slug || generatedSlug,
    }
})
