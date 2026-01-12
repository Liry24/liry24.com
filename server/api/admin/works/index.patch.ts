import { eq } from 'drizzle-orm'
import { works } from '~~/database/schema'

const request = {
    body: worksUpdateSchema.required({ slug: true }),
}

export default adminSessionEventHandler(async () => {
    const { slug, href, title, description, category, image, icon } = await validateBody(
        request.body
    )

    await db
        .update(works)
        .set({
            href,
            title,
            description,
            category,
            image,
            icon,
        })
        .where(eq(works.slug, slug))

    await purgeVercelCDNCacheByTags('works')

    return {
        success: true,
    }
})
