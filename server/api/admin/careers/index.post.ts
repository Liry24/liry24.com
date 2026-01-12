import { careers } from '~~/database/schema'

const request = {
    body: careersInsertSchema,
}

export default adminSessionEventHandler(async () => {
    const { period, position, company } = await validateBody(request.body)

    await db.insert(careers).values({
        period,
        position,
        company,
    })

    await purgeVercelCDNCacheByTags('careers')

    return {
        success: true,
    }
})
