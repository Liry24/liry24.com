import z from 'zod'

const request = {
    params: z.object({
        slug: z.string().min(1),
    }),
}

export default adminSessionEventHandler(async () => {
    const { slug } = await validateParams(request.params)
    await publishPost(db, slug)
    return { success: true, slug }
})
