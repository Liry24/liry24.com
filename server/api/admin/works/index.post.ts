import { works } from '~~/database/schema'

const request = {
    body: worksInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { slug, title, description, category, image, icon, href } = await validateBody(
        request.body
    )

    await db.insert(works).values({
        slug,
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
