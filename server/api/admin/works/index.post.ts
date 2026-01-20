import { generateText } from 'ai'
import { works } from '~~/database/schema'

const request = {
    body: worksInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug, title, description, category, image, icon, href } = await validateBody(
        request.body
    )

    let generatedSlug: string = ''

    const exists = await db.query.works.findMany({
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
                    content: `Create a short slug for the work with the title: ${title}`,
                },
            ],
            system: 'Please return only the slug as your answer.',
        })

        generatedSlug = result.text.trim()
    }

    await db.insert(works).values({
        slug: slug || generatedSlug,
        title,
        description,
        category,
        image,
        icon,
        href,
    })

    await purgeVercelCDNCacheByTags('works')

    return {
        success: true,
    }
})
