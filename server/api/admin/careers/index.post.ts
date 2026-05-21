import { careers } from '@repo/database/schema'

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

    await revalidateISR()

    return {
        success: true,
    }
})
